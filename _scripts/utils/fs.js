const os = require('os');
const path = require('path');
const fsp = require('fs/promises');
const fse = require('fs-extra');
const fs = require('fs');

/**
 * @typedef {{
 *      path: {
 *          abs: string;
 *          rel: string;
 *      };
 *      dir: string;
 * }} FSFileTreeItem
 *
 * @typedef {FSFileTreeItem[]} FSFileTreeList
 *
 * @typedef {{
 *     exist(root_: string | string[], isFile?: boolean): Promise<boolean>,
 *     save(root_: string | string[], data: string | Buffer): Promise<void>,
 *     mkdir(root_: string | string[]): Promise<void>,
 *     read(root_: string | string[]): Promise<Buffer>,
 *     readString(root_: string | string[]): Promise<string>,
 *     readdir(root_: string | string[]): Promise<string[]>,
 *     deleteFile(root_: string | string[]): Promise<void>,
 *     deleteDir(root_: string | string[]): Promise<void>,
 *     rename(
 *         root_: string | string[],
 *         currName: string,
 *         newName: string,
 *     ): Promise<void>,
 *     fileTree(
 *         startingLocation_: string | string[],
 *         currentLocation_: string | string[],
 *     ): Promise<FSFileTreeList>,
 *     copy(
 *         srcPath_: string | string[],
 *         destPath_: string | string[],
 *     ): Promise<void>,
 *     move(
 *         srcPath_: string | string[],
 *         destPath_: string | string[],
 *     ): Promise<void>
 * }} FS
 */

/**
 * @param {string} baseRoot
 * @return FS
 */
function createFS(baseRoot) {
    const isWin = os.platform() === 'win32';
    const slash = isWin ? '\\' : '/';

    /**
     * @param {string | string[]} root
     * @return {string}
     */
    function arrayPathToString(root) {
        return root instanceof Array ? path.join(...root) : root;
    }

    /**
     * @type FS
     */
    const outputFS = {
        async exist(root_, isFile) {
            const root = arrayPathToString(root_);
            return new Promise((resolve, reject) => {
                const pth =
                    root.startsWith('/') || root.charAt(1) === ':'
                        ? root
                        : path.join(baseRoot, root);
                fs.stat(pth, (err, stats) => {
                    if (err) {
                        if (err.code === 'ENOENT') {
                            resolve(false);
                            return;
                        } else {
                            reject(err);
                        }
                        return;
                    }
                    if (isFile) {
                        resolve(stats.isFile());
                    } else {
                        resolve(stats.isDirectory());
                    }
                });
            });
        },

        async save(root_, data) {
            const root = arrayPathToString(root_);
            let parts = root.split(slash).filter((e) => !!e);
            let isAbs = false;
            let base = '';
            if (isWin) {
                if (root.charAt(1) === ':') {
                    isAbs = true;
                    base = parts[0];
                    parts.splice(0, 1);
                }
            } else if (root.startsWith('/')) {
                isAbs = true;
            }
            if (!isAbs) {
                parts = [...baseRoot.split(slash), ...parts];
            }
            if (!isWin) {
                base = '/';
            } else if (isWin && !isAbs) {
                base = parts[0];
                parts.splice(0, 1);
            }
            for (let j = 0; j < parts.length - 1; j++) {
                base = path.join(base, parts[j]);
                try {
                    if (!(await outputFS.exist(base))) {
                        await fsp.mkdir(base);
                    }
                } catch (error) {
                    // Do nothing.
                }
            }
            await fsp.writeFile(path.join(base, parts[parts.length - 1]), data);
        },

        async mkdir(root_) {
            const root = arrayPathToString(root_);
            if (root.startsWith('/') || root.charAt(1) === ':') {
                return await fse.mkdirp(root);
            }
            return await fse.mkdirp(path.join(baseRoot, root));
        },

        async read(root_) {
            const root = arrayPathToString(root_);
            if (root.startsWith('/') || root.charAt(1) === ':') {
                return await fsp.readFile(root);
            }
            return await fsp.readFile(path.join(baseRoot, root));
        },

        async readString(root_) {
            const root = arrayPathToString(root_);
            if (root.startsWith('/') || root.charAt(1) === ':') {
                return (await fsp.readFile(root)).toString();
            }
            return (await fsp.readFile(path.join(baseRoot, root))).toString();
        },

        async readdir(root_) {
            const root = arrayPathToString(root_);
            if (root.startsWith('/') || root.charAt(1) === ':') {
                return await fsp.readdir(root);
            }
            return await fsp.readdir(path.join(baseRoot, root));
        },

        async deleteFile(root_) {
            const root = arrayPathToString(root_);
            if (root.startsWith('/') || root.charAt(1) === ':') {
                return await fsp.unlink(root);
            }
            await fsp.unlink(path.join(baseRoot, root));
        },

        async deleteDir(root_) {
            const root = arrayPathToString(root_);
            if (root.startsWith('/') || root.charAt(1) === ':') {
                await fse.remove(root);
            }
            await fse.remove(path.join(baseRoot, root));
        },

        async rename(root_, currName, newName) {
            const root = arrayPathToString(root_);
            await outputFS.move(
                root.startsWith('/') || root.charAt(1) === ':'
                    ? path.join(root, currName)
                    : path.join(baseRoot, root, currName),
                root.startsWith('/') || root.charAt(1) === ':'
                    ? path.join(root, newName)
                    : path.join(baseRoot, root, newName),
            );
        },

        async fileTree(startingLocation_, currentLocation_) {
            const startingLocation = arrayPathToString(startingLocation_);
            const currentLocation = arrayPathToString(currentLocation_);
            /**
             *
             * @type {FSFileTreeList}
             */
            const output = [];
            const basePath =
                startingLocation.startsWith('/') ||
                startingLocation.charAt(1) === ':'
                    ? path.join(startingLocation, currentLocation)
                    : path.join(baseRoot, startingLocation, currentLocation);
            const files = await fsp.readdir(basePath);
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const filePath = path.join(basePath, file);
                const stat = await fsp.lstat(filePath);
                if (stat.isDirectory()) {
                    const children = await outputFS.fileTree(
                        startingLocation,
                        path.join(currentLocation, file),
                    );
                    for (let j = 0; j < children.length; j++) {
                        const child = children[j];
                        output.push(child);
                    }
                } else {
                    output.push({
                        path: {
                            abs: filePath,
                            rel: path.join(
                                currentLocation,
                                filePath.replace(basePath, '').substring(1),
                            ),
                        },
                        dir: currentLocation,
                    });
                }
            }
            return output;
        },

        async copy(srcPath_, destPath_) {
            const srcPath = arrayPathToString(srcPath_);
            const destPath = arrayPathToString(destPath_);
            await fse.copy(
                srcPath.startsWith('/') || srcPath.charAt(1) === ':'
                    ? srcPath
                    : path.join(baseRoot, srcPath),
                destPath.startsWith('/') || destPath.charAt(1) === ':'
                    ? destPath
                    : path.join(baseRoot, destPath),
            );
        },

        async move(srcPath_, destPath_) {
            const srcPath = arrayPathToString(srcPath_);
            const destPath = arrayPathToString(destPath_);
            await fse.move(
                srcPath.startsWith('/') || srcPath.charAt(1) === ':'
                    ? srcPath
                    : path.join(baseRoot, srcPath),
                destPath.startsWith('/') || destPath.charAt(1) === ':'
                    ? destPath
                    : path.join(baseRoot, destPath),
            );
        },
    };
    return outputFS;
}

exports.createFS = createFS;
