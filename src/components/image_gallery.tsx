import { useState, useEffect } from 'react'

export type Data = { width: number, height: number, file: File, img: HTMLImageElement }



export function ImageGallery({ datas, setActiveData, setRunGenPainting, defaultActivateIndex, }: 
    { 
        datas: Data[], 
        setActiveData: (data: Data) => void,
        setRunGenPainting: (run: boolean) => void,
        defaultActivateIndex: number,
    }) {
    const [activeIndex, setActiveIndex] = useState(defaultActivateIndex || 0);

    useEffect(() => {
        if (datas.length > 0 && defaultActivateIndex != -1) {
            setActiveIndex(datas.length - 1)
        }
    }, [datas]);

    return (
        <ul className="flex overflow-x-auto overflow-hidden">
            {datas.map((data, index) => {
                return <ImageGalleryItem 
                            data={data} 
                            index={index} 
                            activeIndex={activeIndex} 
                            setActiveIndex={setActiveIndex} 
                            setActiveData={setActiveData} 
                            setRunGenPainting={setRunGenPainting}
                            key={index} />
            })}
        </ul>
    );
}

export function ImageGalleryItem({ data, index, activeIndex, setActiveIndex, setActiveData, setRunGenPainting }: 
    { 
        data: Data, 
        index: number, 
        activeIndex: number, 
        setActiveIndex: (index: number) => void, 
        setActiveData: (data: Data) => void,
        setRunGenPainting: (run: boolean) => void,
    }) {

    const handleClick = () => {
        setActiveData(data);
        setActiveIndex(index);
        setRunGenPainting(true);
    };

    return (
        <li>
            <a
                className={`block w-24 h-24 px-3 py-4 ${index === activeIndex ? 'bg-sky-500 text-white' : 'bg-slate-50 opacity-50'}`}
                onClick={handleClick}
            >
                <img
                  src={data.img.src}
                  alt=""
                  style={{cursor: 'pointer', transition: 'transform 0.2s ease'}}
                  className="rounded-md bg-slate-100 object-scale-down"
                  onMouseEnter={(e) => {
                    const target = e.target as HTMLInputElement;
                    target.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    const target = e.target as HTMLInputElement;
                    target.style.transform = 'scale(1)'
                  }}
                />
            </a>
        </li>
    )
}