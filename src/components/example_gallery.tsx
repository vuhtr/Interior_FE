import { useState, useEffect, useRef } from "react"

export type Data = { width: number; height: number; file: File; img: HTMLImageElement }

export function ExampleGallery({
    galleryMode,
    setData,
    dataList,
    setDataList,
    numColumns,
    height,
    setRunGenPainting,
}: {
    galleryMode: string
    setData: (data: Data) => void
    dataList: Data[]
    setDataList: (datas: Data[]) => void
    numColumns: number
    height: number
    setRunGenPainting: (run: boolean) => void
}) {
    const gridRef = useRef(null)
    const [imageDataList, setImageDataList] = useState<Data[]>([])

    const imageRoot = {
        rgb: "/gallery/image/",
        sketch: "/gallery/sketch/",
    }

    const imageFileNames = {
        rgb: require
            .context("../../public/gallery/image", true)
            .keys()
            .map((item: string) => item.replace("./", "")),
        sketch: require
            .context("../../public/gallery/sketch", true)
            .keys()
            .map((item: string) => item.replace("./", "")),
    }

    useEffect(() => {
        setImageDataList([])

        const root = imageRoot[galleryMode as keyof typeof imageRoot]
        const fileNames = imageFileNames[galleryMode as keyof typeof imageRoot]
        const data = []
        fileNames.forEach((fileName: string) => {
            const img = new Image()
            const imageURL = root + fileName

            const fetchData = async () => {
                const data = []

                for (const fileName of fileNames) {
                    const img = new Image()
                    const imageURL = root + fileName
                    try {
                        const response = await fetch(imageURL)
                        const blob = await response.blob()
                        const file = new File([blob], fileName, { type: blob.type })
                        img.src = URL.createObjectURL(file)

                        data.push({ width: 1024, height: 768, file, img })
                        if (data.length === fileNames.length) {
                            setImageDataList(data)
                        }
                    } catch (error) {
                        console.error("Error fetching image:", error)
                    }
                }
            }

            fetchData()
        })
    }, [galleryMode])

    const handleImageClick = (data: Data) => {
        setData(data)
        setDataList([...dataList, data])
        setRunGenPainting(true)
    }

    return (
        <div
            className="gap-4 bg-blue-100 bg-opacity-30"
            style={{
                width: "240px",
                height: `${height}px`,
                justifyContent: "flex-end",
                borderRadius: "10px",
            }}
        >
            <label className="block mb-2 text-lg font-medium text-black mt-4 ml-2">
                Choose an example
            </label>
            <div
                style={{ height: `${height - 60}px`, overflowY: "auto", padding: "10px" }}
            >
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: `repeat(${numColumns}, 1fr)`,
                        gap: "10px",
                    }}
                >
                    {imageDataList.map((item, index) => (
                        <div key={index} style={{ width: "200px", height: "150px" }}>
                            <img
                                src={item.img.src}
                                alt={"image"}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    cursor: "pointer",
                                    transition: "transform 0.2s ease",
                                }}
                                onClick={() => handleImageClick(item)}
                                onMouseEnter={(e) => {
                                    const target = e.target as HTMLInputElement
                                    target.style.transform = "scale(1.05)"
                                }}
                                onMouseLeave={(e) => {
                                    const target = e.target as HTMLInputElement
                                    target.style.transform = "scale(1)"
                                }}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
