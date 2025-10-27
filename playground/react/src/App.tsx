import { useEffect, useState } from 'react';
import './App.css';
import { bcmsClient } from './bcms-client';
import type { PropParsed, EntryContentParsedItem } from '@thebcms/types';
import { BCMSContentManager } from '@thebcms/components-react';

async function fetchData() {
    const items = await bcmsClient.entry.getAll('test');
    return items.map((item) => {
        return {
            meta: item.meta.en,
            content: item.content.en,
        };
    });
}

function App() {
    const [items, setItems] = useState<
        Array<{
            meta: PropParsed;
            content: EntryContentParsedItem[];
        }>
    >([]);

    useEffect(() => {
        fetchData()
            .then((data) => {
                setItems(data);
            })
            .catch((err) => {
                console.error(err);
            });
    }, []);

    return (
        <div
            style={{
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
            }}
        >
            {items.map((item, itemIdx) => {
                return (
                    <BCMSContentManager
                        key={itemIdx}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '20px',
                        }}
                        items={item.content}
                        clientConfig={bcmsClient.getConfig()}
                    />
                );
            })}
        </div>
    );
}

export default App;
