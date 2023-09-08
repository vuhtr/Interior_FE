import { useState, useEffect, useRef } from 'react'
import * as utils from '@/utils';


export type Point = { x: number, y: number, label: number }
export type StrokePoint = { x: number, y: number, color: string, size: number }
export type Mask = { bbox: Array<number>, segmentation: string, area: number }
export type Data = { width: number, height: number, file: File, img: HTMLImageElement }


export function InteractiveSegment(
    { canvasRef, data, processing, mode, points, setPoints, strokeColor, strokeSize, strokePoints, setStrokePoints, masks, ready, setBoxReady}:
        {
            canvasRef: React.RefObject<HTMLCanvasElement>,
            data: Data,
            processing: boolean,
            mode: 'click' | 'box' | 'everything' | 'stroke' | 'manual' | 'edit-sketch' | 'draw-scribble',
            points: Point[],
            strokeColor: string,
            strokeSize: number,
            strokePoints: StrokePoint[][],
            masks: Mask[],
            ready: boolean,
            setPoints: (points: Point[]) => void,
            setStrokePoints: (points: StrokePoint[][]) => void,
            setBoxReady: (ready: boolean) => void,
        }) {
    // const canvasRef = useRef<HTMLCanvasElement>(null)
    const [scale, setScale] = useState<number>(1)
    const [maskAreaThreshold, setMaskAreaThreshold] = useState<number>(0.5)
    const { width, height, img } = data
    const [segments, setSegments] = useState<number[][][]>([])
    const [showSegment, setShowSegment] = useState<boolean>(true)

    useEffect(() => {
        const adapterSize = () => {
            const canvas = canvasRef.current as HTMLCanvasElement
            if (!canvas) return
            const parent = canvas.parentElement
            const scale = Math.min(
                parent?.clientWidth! / img.width, parent?.clientHeight! / img.height)
            setScale(scale)
        }
        window.onresize = adapterSize;
        adapterSize();
    }, [img])

    useEffect(() => {
        setSegments(masks.map(mask => utils.decompress(mask.segmentation, width, height)))
    }, [height, masks, width])

    useEffect(() => {
        const canvas = canvasRef.current as HTMLCanvasElement
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.globalAlpha = 1
        ctx.drawImage(img, 0, 0)

        switch (mode) {
            case 'click':
                break
            case 'box':
                if (points.length === 2) {
                    const x = Math.min(points[0].x, points[1].x)
                    const y = Math.min(points[0].y, points[1].y)
                    const w = Math.abs(points[0].x - points[1].x)
                    const h = Math.abs(points[0].y - points[1].y)
                    ctx.beginPath()
                    ctx.globalAlpha = 0.9
                    ctx.rect(x, y, w, h)
                    ctx.strokeStyle = 'rgba(0 ,0 ,0 , 0.9)'
                    ctx.lineWidth = 2
                    ctx.stroke()
                    ctx.closePath()
                }
                break
            case 'everything':
                break
        }

        if (!showSegment) {
            return
        }

        const rgbas = masks.map((_, i) => [...utils.getRGB(i), 0.1])
        if (masks.length > 0) {
            ctx.beginPath()
            for (let i = 0; i < masks.length; i++) {
                const mask = masks[i]
                if (mask.area / (width * height) > maskAreaThreshold) {
                    continue
                }
                const rgba = rgbas[i]
                const bbox = mask.bbox
                ctx.setLineDash([5, 5])
                ctx.rect((bbox[0]), (bbox[1]), (bbox[2]), (bbox[3]))
                ctx.strokeStyle = `rgba(${rgba[0]}, ${rgba[1]}, ${rgba[2]}, ${rgba[3]})`
                ctx.lineWidth = 2
                ctx.globalAlpha = 0.9
                ctx.stroke()
            }
            ctx.closePath()
        }

        if (segments.length > 0) {
            ctx.beginPath()
            ctx.setLineDash([0])
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            for (let i = 0; i < masks.length; i++) {
                const mask = masks[i]
                if (mask.area / (width * height) > maskAreaThreshold) {
                    continue
                }
                const segmentation = segments[i]
                const rgba = rgbas[i]
                const opacity = rgba[3]
                for (let y = 0; y < canvas.height; y++) {
                    if (segmentation[y].length === 0) {
                        continue
                    }
                    for (let x of segmentation[y]) {
                        const index = (y * canvas.width + x) * 4;
                        imageData.data[index] = imageData.data[index] * opacity + rgba[0] * (1 - opacity);
                        imageData.data[index + 1] = imageData.data[index + 1] * opacity + rgba[1] * (1 - opacity);
                        imageData.data[index + 2] = imageData.data[index + 2] * opacity + rgba[2] * (1 - opacity);
                    }
                }
            }
            ctx.putImageData(imageData, 0, 0);
            ctx.closePath()
        }

        if (points.length > 0) {
            ctx.globalAlpha = 0.9
            for (let i = 0; i < points.length; i++) {
                const point = points[i]
                ctx.beginPath()
                ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI)
                if (point.label === 1) {
                    ctx.fillStyle = 'rgba(0, 255, 0, 0.9)'
                } else {
                    ctx.fillStyle = 'rgba(255, 0, 0, 0.9)'
                }
                ctx.fill()
                ctx.closePath()
            }
        }

        if (strokePoints.length > 0) {
            ctx.globalAlpha = (mode === 'edit-sketch' || mode === 'draw-scribble') ? 1 : 0.9
            ctx.lineCap = 'round';  
            ctx.miterLimit = 2;
            for (let i = 0; i < strokePoints.length; i++) {
                if (strokePoints[i].length === 0) {
                    continue
                }
                const stroke = strokePoints[i]
                ctx.moveTo(stroke[0].x, stroke[0].y)
                ctx.beginPath()
                for (let j = 1; j < stroke.length; j++) {
                    ctx.lineTo(stroke[j].x, stroke[j].y)
                }

                ctx.strokeStyle = stroke[0].color
                ctx.lineWidth = stroke[0].size
                ctx.stroke()
                ctx.closePath()
            }
        }


    }, [height, img, maskAreaThreshold, masks, mode, points, segments, showSegment, width, strokePoints])

    return (
        <div
            className='relative w-fit h-fit'
        >
            <canvas
                className="w-full" ref={canvasRef} width={width} height={height}
                onContextMenu={(e) => {
                    e.preventDefault()
                    if (processing) return
                    const canvas = canvasRef.current as HTMLCanvasElement
                    const rect = canvas.getBoundingClientRect()
                    const x = (e.clientX - rect.left) / scale
                    const y = (e.clientY - rect.top) / scale
                    switch (mode) {
                        case 'click':
                            setPoints([...points, { x, y, label: 0 }])
                            break
                    }
                }}
                onClick={(e) => {
                    e.preventDefault()
                    if (processing) return
                    const canvas = canvasRef.current as HTMLCanvasElement
                    const rect = canvas.getBoundingClientRect()
                    const x = (e.clientX - rect.left) / scale
                    const y = (e.clientY - rect.top) / scale

                    switch (mode) {
                        case 'click':
                            console.log("New click")
                            setPoints([...points, { x, y, label: 1 }])
                            break
                    }
                }}
                onMouseDown={(e) => {
                    e.preventDefault()
                    if (processing) return
                    const canvas = canvasRef.current as HTMLCanvasElement
                    const rect = canvas.getBoundingClientRect()
                    const x = (e.clientX - rect.left) / scale
                    const y = (e.clientY - rect.top) / scale

                    switch (mode) {
                        case 'manual':
                            setStrokePoints([...strokePoints, [{ x, y, color: `rgba(101, 136, 194, 1)`, size: strokeSize }]])
                            break
                        case 'stroke':
                            console.log("New stroke with color", strokeColor)
                            setStrokePoints([...strokePoints, [{ x, y, color: strokeColor, size: strokeSize }]])
                            break
                        case 'edit-sketch':
                            console.log("New stroke with color", strokeColor)
                            setStrokePoints([...strokePoints, [{ x, y, color: strokeColor, size: strokeSize }]])
                            break
                        case 'draw-scribble':
                            console.log("New stroke with color", strokeColor)
                            setStrokePoints([...strokePoints, [{ x, y, color: strokeColor, size: strokeSize }]])
                            break
                    }
                }}


                onMouseMove={(e) => {
                    if (processing) return
                    const canvas = canvasRef.current as HTMLCanvasElement
                    const rect = canvas.getBoundingClientRect()
                    const x = (e.clientX - rect.left) / scale
                    const y = (e.clientY - rect.top) / scale
                    switch (mode) {
                        case 'box':
                            if (e.buttons === 0 && !ready) {
                                setPoints([{ x, y, label: 1 }])
                            } else if (e.buttons === 1 && points.length >= 1) {
                                setBoxReady(false)
                                setPoints([points[0], { x, y, label: 1 }])
                            }
                            break
                        case 'manual':
                            if (e.buttons === 1 && strokePoints.length > 0) {
                                const stroke = strokePoints[strokePoints.length - 1]
                                setStrokePoints([...strokePoints.slice(0, strokePoints.length - 1), [...stroke, { x, y, color: `rgba(101, 136, 194, 1)`, size: strokeSize }]])
                            }
                            break
                        case 'stroke':
                        case 'edit-sketch':
                        case 'draw-scribble':
                            if (e.buttons === 1 && strokePoints.length > 0) {
                                const stroke = strokePoints[strokePoints.length - 1]
                                setStrokePoints([...strokePoints.slice(0, strokePoints.length - 1), [...stroke, { x, y, color: strokeColor, size: strokeSize }]])
                            }
                            break
                        // case 'edit-sketch':
                        //     if (e.buttons === 1 && strokePoints.length > 0) {
                        //         const stroke = strokePoints[strokePoints.length - 1]
                        //         setStrokePoints([...strokePoints.slice(0, strokePoints.length - 1), [...stroke, { x, y, color: strokeColor, size: strokeSize }]])
                        //     }
                        //     break

                    }
                }}
                onMouseUp={(e) => {
                    if (mode !== 'box' || processing) return
                    setBoxReady(true)
                }}
            />
        </div>
    )
}