import Head from "next/head"
import { useState, useEffect, useRef } from "react"
import {
    InteractiveSegment,
    Point,
    StrokePoint,
    Mask,
    Data,
} from "../components/interactive_segment"
import { ImageGallery } from "../components/image_gallery"
import { ExampleGallery } from "@/components/example_gallery"
import Toolbar from "../components/toolbar"
import { Navbar } from "@/components/navbar"
import bg from "../styles/background.jpg"

import NextImage from "next/image"
import "rc-slider/assets/index.css"

function Popup(text: string, timeout: number = 1000) {
    const popup = document.createElement("div")
    popup.className =
        "fixed top-1/2 left-1/2 transform -translate-x-1/2 z-50 bg-white text-gray-500 rounded-xl px-4 py-2"
    popup.innerHTML = text
    document.body.appendChild(popup)
    setTimeout(() => {
        popup.remove()
    }, timeout)
}

function Workspace() {
    const [generateMode, setGenerateMode] = useState<
        "generate" | "generateLayout" | "generateShuffle" | "edit" | "editStroke" | "editStrokeFull"
    >("generate")

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [dataList, setDataList] = useState<Data[]>([])
    const [data, setData] = useState<Data | null>(null)
    const [mode, setMode] = useState<
        "click" | "box" | "everything" | "stroke" | "manual" | "edit-sketch" | 'draw-scribble'
    >("click")
    const [layoutType, setLayoutType] = useState<
        "None" | "canny" | "depth" | "stroke" | "mlsd" | "scribble" | "blur"
    >("None")
    const [points, setPoints] = useState<Point[]>([])
    const [strokePoints, setStrokePoints] = useState<StrokePoint[][]>([])
    const [strokeColor, setStrokeColor] = useState<string>("#dd577a")
    const [strokeSize, setStrokeSize] = useState(50)
    const [masks, setMasks] = useState<Mask[]>([])
    const [prompt, setPrompt] = useState<string>("")
    const [processing, setProcessing] = useState<boolean>(false)
    const [ready, setBoxReady] = useState<boolean>(false)
    const [galleryMode, setGalleryMode] = useState<"rgb" | "sketch">("sketch")
    const controller = useRef<AbortController | null>()

    const [runGenPainting, setRunGenPainting] = useState<boolean>(true)

    const getApiUrl = () => {
        return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
    }

    useEffect(() => {
        setMasks([])
        setPoints([])
        setStrokePoints([])
    }, [data])

    useEffect(() => {
        if (!data) return
        if (mode === "click" && points.length > 0) {
            const fromData = new FormData()
            fromData.append("file", new File([data.file], "image.png"))
            const points_list = points.map((p) => {
                return {
                    x: Math.round(p.x),
                    y: Math.round(p.y),
                }
            })
            const points_labels = points.map((p) => p.label)
            fromData.append(
                "points",
                JSON.stringify({ points: points_list, points_labels })
            )
            controller.current?.abort()
            controller.current = new AbortController()
            setProcessing(true)
            fetch(getApiUrl() + "/api/point", {
                method: "POST",
                body: fromData,
                signal: controller.current?.signal,
            })
                .then((res) => {
                    return res.json()
                })
                .then((res) => {
                    if (res.code == 0) {
                        const maskData = res.data.map((mask: any) => {
                            return mask
                        })
                        setMasks(maskData)
                    }
                })
                .finally(() => {
                    setProcessing(false)
                })
        }
        if (mode === "box") {
            if (!ready) return
            if (points.length !== 2) return
            const fromData = new FormData()
            fromData.append("file", new File([data.file], "image.png"))
            fromData.append(
                "box",
                JSON.stringify({
                    x1: Math.round(points[0].x),
                    y1: Math.round(points[0].y),
                    x2: Math.round(points[1].x),
                    y2: Math.round(points[1].y),
                })
            )

            controller.current?.abort()
            controller.current = new AbortController()
            setProcessing(true)
            fetch(getApiUrl() + "/api/box", {
                method: "POST",
                body: fromData,
                signal: controller.current?.signal,
            })
                .then((res) => {
                    return res.json()
                })
                .then((res) => {
                    if (res.code == 0) {
                        setPoints([])
                        const maskData = res.data.map((mask: any) => {
                            return mask
                        })
                        setMasks(maskData)
                    }
                })
                .finally(() => {
                    setProcessing(false)
                    setBoxReady(false)
                })
        }
    }, [mode, points, ready])

    useEffect(() => {
        setPoints([])
        setMasks([])
        setStrokePoints([])
        setProcessing(false)
        switch (mode) {
            case "click":
                break
            case "box":
                break
            case "everything":
                break
            case "stroke":
                // TODO: popup color selector and stroke size slider
                break
        }
    }, [mode])

    // useEffect(() => {
    //   setStrokePoints([])
    // }, [layoutType])

    const handleTextPrompt = () => {
        if (prompt === "" || !data) return
        const fromData = new FormData()
        fromData.append("file", new File([data.file], "image.png"))
        fromData.append("prompt", JSON.stringify({ text: prompt }))
        controller.current?.abort()
        controller.current = new AbortController()
        setProcessing(true)
        fetch(getApiUrl() + "/api/clip", {
            method: "POST",
            body: fromData,
            signal: controller.current?.signal,
        })
            .then((res) => {
                setProcessing(false)
                return res.json()
            })
            .then((res) => {
                if (res.code == 0) {
                    const maskData = res.data.map((mask: any) => {
                        return mask
                    })
                    setMasks(maskData)
                }
            })
    }

    const handleImageGenerate = async () => {
        const fromData = new FormData()
        fromData.append("prompt", JSON.stringify({ text: prompt }))

        controller.current?.abort()
        controller.current = new AbortController()
        setProcessing(true)

        fetch(getApiUrl() + "/api/generate", {
            method: "POST",
            body: fromData,
            signal: controller.current?.signal,
        })
            .then((res) => {
                setProcessing(false)
                return res.json()
            })
            .then((res) => {
                if (res.code == 0) {
                    const decodedImage = atob(res.data)

                    // Convert the decoded image to an array buffer
                    const buffer = new ArrayBuffer(decodedImage.length)
                    const view = new Uint8Array(buffer)
                    for (let i = 0; i < decodedImage.length; i++) {
                        view[i] = decodedImage.charCodeAt(i)
                    }
                    // Create a blob object from the array buffer
                    const blob = new Blob([buffer], { type: "image/png" })
                    const file = new File([blob], "image.png")

                    // Create an object URL from the blob
                    const objectUrl = URL.createObjectURL(blob)

                    if (file) {
                        // Load the image using the object URL
                        const img = new Image()
                        img.onload = function () {
                            const newData = {
                                width: img.width,
                                height: img.height,
                                file: file,
                                img,
                            }
                            setData(newData)
                            setDataList([...dataList, newData])
                            setPoints([])
                            setMasks([])
                            setStrokePoints([])
                        }
                        img.onerror = function () {
                            console.log("error")
                            // Error loading image
                        }
                        img.src = objectUrl
                    }
                }
            })
    }

    const handleImageGenerateLayout = async () => {
        if (!data) return

        const fromData = new FormData()
        fromData.append("file", new File([data.file], "image.png"))
        fromData.append("prompt", JSON.stringify({ text: prompt }))

        fromData.append("layout_type", JSON.stringify({ text: layoutType }))

        controller.current?.abort()
        controller.current = new AbortController()
        setProcessing(true)

        fetch(getApiUrl() + "/api/generate-layout", {
            method: "POST",
            body: fromData,
            signal: controller.current?.signal,
        })
            .then((res) => {
                setProcessing(false)
                return res.json()
            })
            .then((res) => {
                if (res.code == 0) {
                    const decodedImage = atob(res.data)

                    // Convert the decoded image to an array buffer
                    const buffer = new ArrayBuffer(decodedImage.length)
                    const view = new Uint8Array(buffer)
                    for (let i = 0; i < decodedImage.length; i++) {
                        view[i] = decodedImage.charCodeAt(i)
                    }
                    // Create a blob object from the array buffer
                    const blob = new Blob([buffer], { type: "image/png" })
                    const file = new File([blob], "image.png")

                    // Create an object URL from the blob
                    const objectUrl = URL.createObjectURL(blob)

                    if (file) {
                        // Load the image using the object URL
                        const img = new Image()
                        img.onload = function () {
                            const newData = {
                                width: img.width,
                                height: img.height,
                                file: file,
                                img,
                            }
                            setData(newData)
                            setDataList([...dataList, newData])
                            setPoints([])
                            setMasks([])
                            setStrokePoints([])
                        }
                        img.onerror = function () {
                            console.log("error")
                            // Error loading image
                        }
                        img.src = objectUrl
                    }
                }
            })
    }

    const handleImageGenerateShuffle = async () => {
        if (!data) return

        const fromData = new FormData()
        fromData.append("file", new File([data.file], "image.png"))
        fromData.append("layout_type", JSON.stringify({ text: layoutType }))

        controller.current?.abort()
        controller.current = new AbortController()
        setProcessing(true)

        fetch(getApiUrl() + "/api/generate-shuffle", {
            method: "POST",
            body: fromData,
            signal: controller.current?.signal,
        })
            .then((res) => {
                setProcessing(false)
                return res.json()
            })
            .then((res) => {
                if (res.code == 0) {
                    const decodedImage = atob(res.data)

                    // Convert the decoded image to an array buffer
                    const buffer = new ArrayBuffer(decodedImage.length)
                    const view = new Uint8Array(buffer)
                    for (let i = 0; i < decodedImage.length; i++) {
                        view[i] = decodedImage.charCodeAt(i)
                    }
                    // Create a blob object from the array buffer
                    const blob = new Blob([buffer], { type: "image/png" })
                    const file = new File([blob], "image.png")

                    // Create an object URL from the blob
                    const objectUrl = URL.createObjectURL(blob)

                    if (file) {
                        // Load the image using the object URL
                        const img = new Image()
                        img.onload = function () {
                            const newData = {
                                width: img.width,
                                height: img.height,
                                file: file,
                                img,
                            }
                            setData(newData)
                            setDataList([...dataList, newData])
                            setPoints([])
                            setMasks([])
                            setStrokePoints([])
                        }
                        img.onerror = function () {
                            console.log("error")
                            // Error loading image
                        }
                        img.src = objectUrl
                    }
                }
            })
    }

    const handleImageGenerateLayoutWithSketch = async () => {
        if (!data || strokePoints.length === 0) return

        const canvas = canvasRef.current as HTMLCanvasElement
        if (!canvas) return

        const fromData = new FormData()

        // send contents of canvas as File object to backend
        const dataURL = canvas.toDataURL("image/png")
        const blobBin = atob(dataURL.split(",")[1])
        const array = []
        for (let i = 0; i < blobBin.length; i++) {
            array.push(blobBin.charCodeAt(i))
        }
        const file = new File([new Uint8Array(array)], "image.png", { type: "image/png" })
        fromData.append("file", file)
        let img = new Image()
        img.src = dataURL

        // add edited image to gallery
        setDataList((dataList) => {
            return [
                ...dataList,
                {
                    width: canvas.width,
                    height: canvas.height,
                    file,
                    img: img
                }
            ]
        })

        // fromData.append('file', new File([data.file], 'image.png'))
        // fromData.append('file', new File([data.file], 'image.png'))
        fromData.append("prompt", JSON.stringify({ text: prompt }))

        fromData.append("layout_type", JSON.stringify({ text: layoutType }))

        controller.current?.abort()
        controller.current = new AbortController()
        setProcessing(true)

        fetch(getApiUrl() + "/api/generate-layout", {
            method: "POST",
            body: fromData,
            signal: controller.current?.signal,
        })
            .then((res) => {
                setProcessing(false)
                return res.json()
            })
            .then((res) => {
                if (res.code == 0) {
                    const decodedImage = atob(res.data)

                    // Convert the decoded image to an array buffer
                    const buffer = new ArrayBuffer(decodedImage.length)
                    const view = new Uint8Array(buffer)
                    for (let i = 0; i < decodedImage.length; i++) {
                        view[i] = decodedImage.charCodeAt(i)
                    }
                    // Create a blob object from the array buffer
                    const blob = new Blob([buffer], { type: "image/png" })
                    const file = new File([blob], "image.png")

                    // Create an object URL from the blob
                    const objectUrl = URL.createObjectURL(blob)

                    if (file) {
                        // Load the image using the object URL
                        const img = new Image()
                        img.onload = function () {
                            const newData = {
                                width: img.width,
                                height: img.height,
                                file: file,
                                img,
                            }
                            setData(newData)
                            setDataList((dataList) => {
                                return [
                                    ...dataList, 
                                    newData
                                ]
                            })
                            setPoints([])
                            setMasks([])
                            setStrokePoints([])
                        }
                        img.onerror = function () {
                            console.log("error")
                            // Error loading image
                        }
                        img.src = objectUrl
                    }
                }
            })
    }

    const handleImageGenerateLayoutScribble = async () => {
        const canvas = canvasRef.current as HTMLCanvasElement
        if (!canvas) return

        const formData = new FormData()
        
        // canvas data to image
        const dataURL = canvas.toDataURL("image/png")   // base64
        const blobBin = atob(dataURL.split(",")[1])
        const array = []
        for (let i = 0; i < blobBin.length; i++) {
            array.push(blobBin.charCodeAt(i))
        }
        const file = new File([new Uint8Array(array)], "image.png", { type: "image/png" })
        let img = new Image()
        img.src = dataURL
        setDataList((dataList) => {
            return [
                ...dataList,
                {
                    width: canvas.width,
                    height: canvas.height,
                    file,
                    img: img
                }
            ]
            }
        )
        formData.append("file", file)

        // other infors
        formData.append("prompt", JSON.stringify({ text: prompt }))
        formData.append("layout_type", JSON.stringify({ text: layoutType }))

        controller.current?.abort()
        controller.current = new AbortController()

        setProcessing(true)
        fetch(getApiUrl() + "/api/generate-layout", {
            method: "POST",
            body: formData,
            signal: controller.current?.signal,
        })
            .then((res) => {
                setProcessing(false)
                return res.json()
            })
            .then((res) => {
                if (res.code == 0) {
                    const decodedImage = atob(res.data)

                    // Convert the decoded image to an array buffer
                    const buffer = new ArrayBuffer(decodedImage.length)
                    const view = new Uint8Array(buffer)
                    for (let i = 0; i < decodedImage.length; i++) {
                        view[i] = decodedImage.charCodeAt(i)
                    }
                    // Create a blob object from the array buffer
                    const blob = new Blob([buffer], { type: "image/png" })
                    const file = new File([blob], "image.png")

                    // Create an object URL from the blob
                    const objectUrl = URL.createObjectURL(blob)

                    if (file) {
                        // Load the image using the object URL
                        const img = new Image()
                        img.onload = function () {
                            const newData = {
                                width: img.width,
                                height: img.height,
                                file: file,
                                img,
                            }
                            setData(newData)
                            setDataList((dataList) => {
                                return [
                                    ...dataList, 
                                    newData
                                ]
                            })
                            setPoints([])
                            setMasks([])
                            setStrokePoints([])
                        }
                        img.onerror = function () {
                            console.log("error")
                            // Error loading image
                        }
                        img.src = objectUrl
                    }
                }
            })
    }

    const handleImageEditStrokeFull = async () => {
        const canvas = canvasRef.current as HTMLCanvasElement
        if (!canvas) return

        const formData = new FormData()
        
        // canvas data to image: Painting image
        const dataURL = canvas.toDataURL("image/png")   // base64
        const blobBin = atob(dataURL.split(",")[1])
        const array = []
        for (let i = 0; i < blobBin.length; i++) {
            array.push(blobBin.charCodeAt(i))
        }
        const file = new File([new Uint8Array(array)], "image.png", { type: "image/png" })
        formData.append("stroke_file", file)

        // original image (last item of dataList)
        const originalData = dataList[dataList.length - 1]
        formData.append("file", originalData.file)

        // other infors
        formData.append("prompt", JSON.stringify({ text: prompt }))
        // TODO
        // formData.append("layout_type", JSON.stringify({ text: layoutType }))

        controller.current?.abort()
        controller.current = new AbortController()

        setProcessing(true)
        // TODO
        fetch(getApiUrl() + "/api/editStrokeFull", {
            method: "POST",
            body: formData,
            signal: controller.current?.signal,
        })
            .then((res) => {
                setProcessing(false)
                return res.json()
            })
            .then((res) => {
                if (res.code == 0) {
                    const decodedImage = atob(res.data)

                    // Convert the decoded image to an array buffer
                    const buffer = new ArrayBuffer(decodedImage.length)
                    const view = new Uint8Array(buffer)
                    for (let i = 0; i < decodedImage.length; i++) {
                        view[i] = decodedImage.charCodeAt(i)
                    }
                    // Create a blob object from the array buffer
                    const blob = new Blob([buffer], { type: "image/png" })
                    const file = new File([blob], "image.png")

                    // Create an object URL from the blob
                    const objectUrl = URL.createObjectURL(blob)

                    if (file) {
                        // Load the image using the object URL
                        const img = new Image()
                        img.onload = function () {
                            const newData = {
                                width: img.width,
                                height: img.height,
                                file: file,
                                img,
                            }
                            setData(newData)
                            setDataList((dataList) => {
                                return [
                                    ...dataList, 
                                    newData
                                ]
                            })
                            setPoints([])
                            setMasks([])
                            setStrokePoints([])
                        }
                        img.onerror = function () {
                            console.log("error")
                            // Error loading image
                        }
                        img.src = objectUrl
                    }
                }
            })

    }

    const handleImageEdit = () => {
        if (!data || !masks) return

        const fromData = new FormData()
        fromData.append("file", new File([data.file], "image.png"))
        fromData.append("prompt", JSON.stringify({ text: prompt }))
        fromData.append("segmentations", JSON.stringify(masks))
        fromData.append("layout_type", JSON.stringify({ text: layoutType }))

        controller.current?.abort()
        controller.current = new AbortController()
        setProcessing(true)

        fetch(getApiUrl() + "/api/edit", {
            method: "POST",
            body: fromData,
            signal: controller.current?.signal,
        })
            .then((res) => {
                setProcessing(false)
                return res.json()
            })
            .then((res) => {
                if (res.code == 0) {
                    const decodedImage = atob(res.data)

                    // Convert the decoded image to an array buffer
                    const buffer = new ArrayBuffer(decodedImage.length)
                    const view = new Uint8Array(buffer)
                    for (let i = 0; i < decodedImage.length; i++) {
                        view[i] = decodedImage.charCodeAt(i)
                    }
                    // Create a blob object from the array buffer
                    const blob = new Blob([buffer], { type: "image/png" })
                    const file = new File([blob], "image.png")

                    // Create an object URL from the blob
                    const objectUrl = URL.createObjectURL(blob)

                    if (file) {
                        // Load the image using the object URL
                        const img = new Image()
                        img.onload = function () {
                            const newData = {
                                width: img.width,
                                height: img.height,
                                file: file,
                                img,
                            }
                            setData(newData)
                            setDataList([...dataList, newData])
                            setPoints([])
                            setMasks([])
                            setStrokePoints([])
                        }
                        img.onerror = function () {
                            console.log("error")
                            // Error loading image
                        }
                        img.src = objectUrl
                    }
                }
            })
    }

    const handleImageEditManualMask = () => {
        if (!data || strokePoints.length === 0) return

        const fromData = new FormData()
        fromData.append("file", new File([data.file], "image.png"))
        fromData.append("prompt", JSON.stringify({ text: prompt }))
        fromData.append("layout_type", JSON.stringify({ text: layoutType }))

        let strokePointList = []
        let strokeLengths = []

        for (let i = 0; i < strokePoints.length; i++) {
            const stroke = strokePoints[i]
            for (let j = 0; j < stroke.length; j++) {
                const point = stroke[j]
                strokePointList.push({
                    x: Math.round(point.x),
                    y: Math.round(point.y),
                    color: point.color,
                    size: point.size,
                })
            }
            strokeLengths.push(stroke.length)
        }
        fromData.append(
            "strokePoints",
            JSON.stringify({ strokePoints: strokePointList, strokeLengths })
        )

        controller.current?.abort()
        controller.current = new AbortController()
        setProcessing(true)

        fetch(getApiUrl() + "/api/editManualMask", {
            method: "POST",
            body: fromData,
            signal: controller.current?.signal,
        })
            .then((res) => {
                setProcessing(false)
                return res.json()
            })
            .then((res) => {
                if (res.code == 0) {
                    const decodedImage = atob(res.data)

                    // Convert the decoded image to an array buffer
                    const buffer = new ArrayBuffer(decodedImage.length)
                    const view = new Uint8Array(buffer)
                    for (let i = 0; i < decodedImage.length; i++) {
                        view[i] = decodedImage.charCodeAt(i)
                    }
                    // Create a blob object from the array buffer
                    const blob = new Blob([buffer], { type: "image/png" })
                    const file = new File([blob], "image.png")

                    // Create an object URL from the blob
                    const objectUrl = URL.createObjectURL(blob)

                    if (file) {
                        // Load the image using the object URL
                        const img = new Image()
                        img.onload = function () {
                            const newData = {
                                width: img.width,
                                height: img.height,
                                file: file,
                                img,
                            }
                            setData(newData)
                            setDataList([...dataList, newData])
                            setPoints([])
                            setMasks([])
                            setStrokePoints([])
                        }
                        img.onerror = function () {
                            console.log("error")
                            // Error loading image
                        }
                        img.src = objectUrl
                    }
                }
            })
    }

    const handleImageEditStroke = () => {
        if (!data || strokePoints.length === 0) return

        const fromData = new FormData()
        fromData.append("file", new File([data.file], "image.png"))
        fromData.append("prompt", JSON.stringify({ text: prompt }))
        fromData.append("layout_type", JSON.stringify({ text: "canny" }))

        let strokePointList = []
        let strokeLengths = []

        for (let i = 0; i < strokePoints.length; i++) {
            const stroke = strokePoints[i]
            for (let j = 0; j < stroke.length; j++) {
                const point = stroke[j]
                strokePointList.push({
                    x: Math.round(point.x),
                    y: Math.round(point.y),
                    color: point.color,
                    size: point.size,
                })
            }
            strokeLengths.push(stroke.length)
        }
        fromData.append(
            "strokePoints",
            JSON.stringify({ strokePoints: strokePointList, strokeLengths })
        )

        controller.current?.abort()
        controller.current = new AbortController()
        setProcessing(true)

        fetch(getApiUrl() + "/api/editStroke", {
            method: "POST",
            body: fromData,
            signal: controller.current?.signal,
        })
            .then((res) => {
                setProcessing(false)
                return res.json()
            })
            .then((res) => {
                if (res.code == 0) {
                    const decodedImage = atob(res.data)

                    // Convert the decoded image to an array buffer
                    const buffer = new ArrayBuffer(decodedImage.length)
                    const view = new Uint8Array(buffer)
                    for (let i = 0; i < decodedImage.length; i++) {
                        view[i] = decodedImage.charCodeAt(i)
                    }
                    // Create a blob object from the array buffer
                    const blob = new Blob([buffer], { type: "image/png" })
                    const file = new File([blob], "image.png")

                    // Create an object URL from the blob
                    const objectUrl = URL.createObjectURL(blob)

                    if (file) {
                        // Load the image using the object URL
                        const img = new Image()
                        img.onload = function () {
                            const newData = {
                                width: img.width,
                                height: img.height,
                                file: file,
                                img,
                            }
                            setData(newData)
                            setDataList([...dataList, newData])
                            setPoints([])
                            setMasks([])
                            setStrokePoints([])
                        }
                        img.onerror = function () {
                            console.log("error")
                            // Error loading image
                        }
                        img.src = objectUrl
                    }
                }
            })
    }

    const handleGenerateEdit = () => {
        if (generateMode === "generateShuffle") {
            handleImageGenerateShuffle()
        }
        else if (generateMode === "editStrokeFull") {
            handleImageEditStrokeFull()
        }
        else if (strokePoints.length > 0) {
            // edit with stroke
            if (mode === "stroke") {
                handleImageEditStroke()
            } else if (mode === "manual") {
                handleImageEditManualMask()
            } else if (mode === "edit-sketch") {
                handleImageGenerateLayoutWithSketch()
            } else if (mode === 'draw-scribble') {
                handleImageGenerateLayoutScribble()
            }
        } else if (masks.length > 0) {
            // edit with layout
            handleImageEdit()
        } else if (data && layoutType !== "None") {
            // generate with layout
            handleImageGenerateLayout()
        } else {
            // generate without layout
            handleImageGenerate()
        }
    }

    const clearAll = () => {
        setData(null)
        setDataList([])
        setPoints([])
        setMasks([])
        // setMode("click")
        setStrokePoints([])
    }

    const clearSegs = () => {
        setPoints([])
        setMasks([])
        setStrokePoints([])
    }

    const uploadImage = () => {
        const input = document.createElement("input")
        input.type = "file"
        input.accept = "image/*"
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (file) {
                const img = new Image()
                img.src = URL.createObjectURL(file)
                img.onload = () => {
                    const newData = {
                        width: img.width,
                        height: img.height,
                        file,
                        img,
                    }
                    setData(newData)
                    setDataList([newData])
                }
            }
        }
        input.click()
    }

    const getPaintingImage = async () => {
        // last item of data
        if (!data) return

        const formData = new FormData()
        formData.append("file", new File([data.file], "image.png"))

        controller.current?.abort()
        controller.current = new AbortController()

        setProcessing(true)
        fetch(getApiUrl() + "/api/painting", {
            method: "POST",
            body: formData,
            signal: controller.current?.signal,
        })
            .then((res) => {
                setProcessing(false)
                return res.json()
            })
            .then((res) => {
                if (res.code == 0) {
                    const decodedImage = atob(res.data)

                    // Convert the decoded image to an array buffer
                    const buffer = new ArrayBuffer(decodedImage.length)
                    const view = new Uint8Array(buffer)
                    for (let i = 0; i < decodedImage.length; i++) {
                        view[i] = decodedImage.charCodeAt(i)
                    }
                    // Create a blob object from the array buffer
                    const blob = new Blob([buffer], { type: "image/png" })
                    const file = new File([blob], "image.png")

                    // Create an object URL from the blob
                    const objectUrl = URL.createObjectURL(blob)

                    if (file) {
                        // Load the image using the object URL
                        const img = new Image()
                        img.onload = function () {
                            const newData = {
                                width: img.width,
                                height: img.height,
                                file: file,
                                img
                            }
                            // // replace last item of data
                            // setDataList((dataList) => {
                            //     return [
                            //         ...dataList.slice(0, -1),
                            //         newData
                            //     ]
                            // })
                            // setDataList([...dataList, newData])
                            setData(newData)
                            setRunGenPainting(false)
                            setPoints([])
                            setMasks([])
                            setStrokePoints([])
                        }
                        img.onerror = function () {
                            console.log("error")
                            // Error loading image
                        }
                        img.src = objectUrl
                    }
                }
            })
    }

    useEffect(() => {
        if (generateMode === "editStrokeFull" && runGenPainting) {
            getPaintingImage()
        }
    }, [data])

    useEffect(() => {
        setData(null)
    }, [generateMode])

    return (
        <div
            className="flex items-stretch justify-center flex-1 stage max-h-full"
            tabIndex={0}
        >
            {data ? (
                <div className="flex flex-row justify-center gap-4 w-screen m-auto my-2 md:px-12 md:py-9">
                    <div className="w-1/4">
                        <Toolbar
                            generateMode={generateMode}
                            setGenerateMode={setGenerateMode}
                            data={data}
                            setData={setData}
                            prompt={prompt}
                            setPrompt={setPrompt}
                            handleGenerateEdit={handleGenerateEdit}
                            clearSegs={clearSegs}
                            clearAll={clearAll}
                            layoutType={layoutType}
                            setLayoutType={setLayoutType}
                            interactiveMode={mode}
                            setInteractiveMode={setMode}
                            uploadImage={uploadImage}
                            strokeSize={strokeSize}
                            setStrokeSize={setStrokeSize}
                            strokeColor={strokeColor}
                            setStrokeColor={setStrokeColor}
                            setGalleryMode={setGalleryMode}
                            masks={masks}
                            strokePoints={strokePoints}
                            processing={processing}
                        />
                    </div>

                    <div className="flex flex-col w-2/4 ">
                        <InteractiveSegment
                            canvasRef={canvasRef}
                            data={data}
                            mode={mode}
                            processing={processing}
                            points={points}
                            setPoints={setPoints}
                            masks={masks}
                            strokeColor={strokeColor}
                            strokeSize={strokeSize}
                            strokePoints={strokePoints}
                            setStrokePoints={setStrokePoints}
                            ready={ready}
                            setBoxReady={setBoxReady}
                        />

                        <ImageGallery datas={dataList} setActiveData={setData} setRunGenPainting={setRunGenPainting} defaultActivateIndex={0} />

                        <button
                            className="btn p-2 text-xs font-medium text-black bg-blue-400 hover:bg-blue-600 rounded-lg text-center"
                            onClick={() => {
                                const downloadUrl = data.img.src
                                const link = document.createElement("a")
                                link.href = downloadUrl
                                link.download = "image.jpg"
                                link.click()
                            }}
                            style={{ fontSize: "14px", margin: "10px" }}
                        >
                            Download
                        </button>

                        {/* {processing && (
                            <div className=" left-0 w-full flex items-center bg-black bg-opacity-50">
                                <div className="flex flex-col items-center justify-center w-full h-full">
                                    <div className="text-white text-2xl">Processing</div>
                                    <div className="flex flex-row justify-center">
                                        <div className="w-2 h-2 bg-white rounded-full animate-bounce mx-1"></div>
                                        <div className="w-2 h-2 bg-white rounded-full animate-bounce mx-1"></div>
                                        <div className="w-2 h-2 bg-white rounded-full animate-bounce mx-1"></div>
                                    </div>
                                    <div className="text-white text-sm">
                                        Please wait a moment
                                    </div>
                                </div>
                            </div>
                        )} */}
                    </div>
                    <ExampleGallery
                        galleryMode={galleryMode}
                        setData={setData}
                        dataList={dataList}
                        setDataList={setDataList}
                        setRunGenPainting={setRunGenPainting}
                        numColumns={1}
                        height={680}
                    />
                </div>
            ) : (
                <div className="flex flex-row justify-center gap-4 w-screen m-auto my-2 md:px-12 md:py-9">
                    <div className="w-1/4">
                        <Toolbar
                            generateMode={generateMode}
                            setGenerateMode={setGenerateMode}
                            data={data}
                            setData={setData}
                            prompt={prompt}
                            setPrompt={setPrompt}
                            handleGenerateEdit={handleGenerateEdit}
                            clearSegs={clearSegs}
                            clearAll={clearAll}
                            layoutType={layoutType}
                            setLayoutType={setLayoutType}
                            interactiveMode={mode}
                            setInteractiveMode={setMode}
                            uploadImage={uploadImage}
                            strokeSize={strokeSize}
                            setStrokeSize={setStrokeSize}
                            strokeColor={strokeColor}
                            setStrokeColor={setStrokeColor}
                            setGalleryMode={setGalleryMode}
                            masks={masks}
                            strokePoints={strokePoints}
                            processing={processing}
                        />
                    </div>

                    <div className="flex flex-col w-2/4 ">

                        <div
                            className={
                                "flex-none flex flex-col items-center justify-center h-96 border-2 border-dashed border-gray-400 rounded-lg " +
                                "hover:border-blue-500 hover:bg-blue-50 hover:text-blue-500" +
                                "focus-within:border-blue-500 focus-within:bg-blue-50 focus-within:text-blue-500"
                            }
                            onDragOver={(e) => {
                                e.preventDefault()
                            }}
                            onDrop={(e) => {
                                e.preventDefault()
                                const file = e.dataTransfer.files[0]
                                if (file) {
                                    const img = new Image()
                                    img.src = URL.createObjectURL(file)
                                    img.onload = () => {
                                        const newData = {
                                            width: img.width,
                                            height: img.height,
                                            file,
                                            img,
                                        }
                                        setData(newData)
                                        setDataList([newData])
                                    }
                                }
                            }}
                        >
                            <p className="text-sm text-gray-400 md:visible sm:invisible">
                                Drag and drop your image here
                            </p>
                            <p className="text-sm text-gray-400">or</p>
                            {!processing && (
                                <button
                                    className="bg-blue-500 text-white transition-all false max-h-[40px] my-2 rounded-xl px-4 py-2 cursor-pointer outline outline-gray-200 false false hover:bg-blue-800"
                                    onClick={() => {
                                        const input = document.createElement("input")
                                        input.type = "file"
                                        input.accept = "image/*"
                                        input.onchange = (e) => {
                                            const file = (e.target as HTMLInputElement)
                                                .files?.[0]
                                            if (file) {
                                                const img = new Image()
                                                img.src = URL.createObjectURL(file)
                                                img.onload = () => {
                                                    const newData = {
                                                        width: img.width,
                                                        height: img.height,
                                                        file,
                                                        img,
                                                    }
                                                    setData(newData)
                                                    setDataList([newData])
                                                }
                                            }
                                        }
                                        input.click()
                                    }}
                                >
                                    Upload a file
                                </button>
                            )}
                            {/* {processing && (
                                <div className=" left-0 w-full flex items-center bg-black bg-opacity-50">
                                    <div className="flex flex-col items-center justify-center w-full h-full">
                                        <div className="text-white text-2xl">Processing</div>
                                        <div className="flex flex-row justify-center">
                                            <div className="w-2 h-2 bg-white rounded-full animate-bounce mx-1"></div>
                                            <div className="w-2 h-2 bg-white rounded-full animate-bounce mx-1"></div>
                                            <div className="w-2 h-2 bg-white rounded-full animate-bounce mx-1"></div>
                                        </div>
                                        <div className="text-white text-sm">
                                            Please wait a moment
                                        </div>
                                    </div>
                                </div>
                            )} */}
                        </div>

                        <ImageGallery datas={dataList} setActiveData={setData} setRunGenPainting={setRunGenPainting} defaultActivateIndex={-1} />

                    </div>

                    <ExampleGallery
                        galleryMode={galleryMode}
                        setData={setData}
                        dataList={dataList}
                        setDataList={setDataList}
                        setRunGenPainting={setRunGenPainting}
                        numColumns={1}
                        height={680}
                    />
                </div>
            )}

            {processing && (
                // show modal to disable clicks
                <div className="fixed left-0 top-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50">
                    <div className="flex flex-col items-center justify-center bg-white rounded-lg p-4">
                        <div className="text-2xl text-black">Processing</div>
                        <div className="flex flex-row justify-center mt-2 mb-2">
                            <div className="w-2 h-2 bg-black rounded-full animate-bounce mx-1"></div>
                            <div className="w-2 h-2 bg-black rounded-full animate-bounce mx-1"></div>
                            <div className="w-2 h-2 bg-black rounded-full animate-bounce mx-1"></div>
                        </div>
                        <div className="text-base text-black">Please wait a moment</div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default function Home() {
    return (
        <div style={{
            position: "relative"
        }}>
            <Head>
                <title>Rinterior</title>
                <meta name="description" content="Rinterior" />
            </Head>
            <div className="fixed left-0 top-0 h-screen w-screen overflow-hidden -z-10">
                <NextImage src={bg.src} fill={true} alt="" />
                <div className="h-full w-full bg-black	opacity-70"></div>
            </div>
            <main className="flex flex-col min-h-screen">
                <Navbar />
                <Workspace />
            </main>
        </div>
    )
}
