import { useEffect, useState } from "react"
import { SketchPicker } from "react-color"
import Slider from "rc-slider"
import { StrokePoint, Mask } from "../components/interactive_segment"
declare const window: any
import { Pencil, Eraser } from "lucide-react"

export default function Toolbar({
    generateMode,
    setGenerateMode,
    data,
    setData,
    prompt,
    setPrompt,
    handleGenerateEdit,
    clearSegs,
    clearAll,
    layoutType,
    setLayoutType,
    interactiveMode,
    setInteractiveMode,
    uploadImage,
    strokeSize,
    setStrokeSize,
    strokeColor,
    setStrokeColor,
    setGalleryMode,
    masks,
    strokePoints,
    processing,
}: {
    generateMode: string,
    setGenerateMode: (mode: "generate" | "generateLayout" | "generateShuffle" | "edit" | "editStroke" | "editStrokeFull") => void
    data: any
    setData: (data: any) => void
    prompt: string
    setPrompt: (prompt: string) => void
    handleGenerateEdit: () => void
    clearSegs: () => void
    clearAll: () => void
    layoutType: string
    setLayoutType: (layoutType: "None" | "canny" | "depth" | "stroke" | "mlsd" | "scribble" | "blur") => void
    interactiveMode: string
    setInteractiveMode: (
        mode: "click" | "box" | "everything" | "stroke" | "manual" | "edit-sketch" | "draw-scribble"
    ) => void
    uploadImage: () => void
    strokeSize: number
    setStrokeSize: (strokeSize: number) => void
    strokeColor: string
    setStrokeColor: (strokeColor: string) => void
    setGalleryMode: (galleryMode: "rgb" | "sketch") => void
    masks: Mask[]
    strokePoints: StrokePoint[][]
    processing: boolean
}) {
    // const [generateMode, setGenerateMode] = useState<
    //     "generate" | "generateLayout" | "edit" | "editStroke" | "editStrokeFull"
    // >("generate")
    const [editSketchMode, setEditSketchMode] = useState<"pencil" | "eraser">("pencil")
    // const [editSketchMode, setEditSketchMode] = useState<"pencil" | "eraser">("pencil")

    const getDefaultPrompt = (): string => {
        if (generateMode === "generate" || generateMode === "generateLayout")
            return "indoor luxurious modern, glass window, city view, wooden floor, daylight"
        return ""
    }

    const setupWhiteBoard = () => {
        // read image from file path
        const boardPath = "/toolbar/board.png"
        const boardImg = new Image()
        boardImg.src = boardPath
        boardImg.onload = () => {
            const newData = {
                width: boardImg.width,
                height: boardImg.height,
                file: null,
                img: boardImg
            }
            setData(newData)
        }
    }

    useEffect(() => {
        setGalleryMode(generateMode === "generate" ? "sketch" : "rgb")
        setPrompt(getDefaultPrompt())
    }, [generateMode])

    useEffect(() => {
        if (generateMode === "generate") {
            let curInteractMode: "click" | "box" | "everything" | "stroke" | "manual" | "edit-sketch" | "draw-scribble" = "everything"
            if (layoutType == "canny") {
                curInteractMode = "edit-sketch"
            }
            else if (layoutType == "scribble") {
                curInteractMode = "draw-scribble"
            }
            setInteractiveMode(curInteractMode)

            if (curInteractMode === "edit-sketch" || curInteractMode === "draw-scribble") {
                setEditSketchMode("pencil")
            }

            if (curInteractMode === "draw-scribble") {
                setupWhiteBoard()
            } else {
                setData(null)
            }
        }
    }, [layoutType])

    useEffect(() => {
        if (editSketchMode === "pencil") {
            setStrokeColor("#000000")
            if (interactiveMode === "draw-scribble")
                setStrokeSize(10)
            else
                setStrokeSize(2)
        } else {
            // erase
            setStrokeColor("#FFFFFF")
            if (interactiveMode === "draw-scribble")
                setStrokeSize(35)
            else
                setStrokeSize(20)
        }
    }, [editSketchMode, interactiveMode])

    return (
        <div className="flex flex-col gap-4 bg-blue-100 bg-opacity-30 p-4 rounded-lg">
            <GenerateModeDropDown
                generateMode={generateMode}
                setGenerateMode={setGenerateMode}
            />
            {(generateMode === "edit" || generateMode === "editStroke") && (
                <div style={{ marginTop: "-20px", marginBottom: "-20px" }}>
                    <label className="label flex flex-row">
                        <span className="label-text text-sm font-sm text-black ">
                            This feature is currently in development and works well only
                            in certain simple cases. Refer to Tutorial for more detailed
                            information.
                        </span>
                        {/* <span className="label-text text-sm font-sm text-black ">
                        </span> */}
                    </label>
                </div>
            )}

            {
                (generateMode !== "generateShuffle") && (
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text text-lg font-medium text-black ">
                                {generateMode === "generate" || generateMode === "generateLayout"
                                    ? "Describe your dream room:"
                                    : "Edit your room with:"}
                            </span>
                        </label>
                        <textarea
                            className="textarea textarea-bordered h-24"
                            value={prompt}
                            onChange={(e) => {
                                setPrompt(e.target.value)
                            }}
                        ></textarea>
                    </div>
                )
            }

            {generateMode === "generate" && (
                <GenerateTab
                    layoutType={layoutType}
                    setLayoutType={setLayoutType}
                    setInteractiveMode={setInteractiveMode}
                    setData={setData}
                />
            )}
            {generateMode === "generateLayout" && (
                <GenerateLayoutTab
                    layoutType={layoutType}
                    setLayoutType={setLayoutType}
                    setInteractiveMode={setInteractiveMode}
                />
            )}
            {generateMode === "generateShuffle" && (
                <GenerateShuffleTab
                    layoutType={layoutType}
                    setLayoutType={setLayoutType}
                    setInteractiveMode={setInteractiveMode}
                />
            )}
            {generateMode === "edit" && (
                <EditTab
                    layoutType={layoutType}
                    setLayoutType={setLayoutType}
                    interactiveMode={interactiveMode}
                    setInteractiveMode={setInteractiveMode}
                    strokeSize={strokeSize}
                    setStrokeSize={setStrokeSize}
                />
            )}
            {generateMode === "editStroke" && (
                <EditStrokeTab
                    layoutType={layoutType}
                    setLayoutType={setLayoutType}
                    setInteractiveMode={setInteractiveMode}
                    strokeSize={strokeSize}
                    setStrokeSize={setStrokeSize}
                    strokeColor={strokeColor}
                    setStrokeColor={setStrokeColor}
                />
            )}
            {/* {generateMode === "editStrokeFull" && (
                <EditStrokeFullTab
                    layoutType={layoutType}
                    setLayoutType={setLayoutType}
                    setInteractiveMode={setInteractiveMode}
                    strokeSize={strokeSize}
                    setStrokeSize={setStrokeSize}
                    strokeColor={strokeColor}
                    setStrokeColor={setStrokeColor}
                />
            )} */}

            {(interactiveMode == "edit-sketch" || interactiveMode === 'draw-scribble') && (
                <div className="button-container flex flex-row w-full gap-4 justify-evenly">
                    <button
                        className={
                            editSketchMode === "pencil"
                                ? "btn opacity-100 "
                                : "btn opacity-50 hover:opacity-80 "
                        }
                        onClick={() => {
                            setEditSketchMode("pencil")
                        }}
                    >
                        <Pencil size={24} color="White" />
                    </button>

                    <button
                        className={
                            editSketchMode === "eraser"
                                ? "btn opacity-100 "
                                : "btn opacity-50 hover:opacity-80 "
                        }
                        onClick={() => {
                            setEditSketchMode("eraser")
                        }}
                    >
                        <Eraser size={24} color="White" />
                    </button>
                </div>
            )}

            {(interactiveMode === "draw-scribble" || interactiveMode === "edit-sketch") && (
                <div>
                    <label className="label-text text-lg font-medium text-black">
                        Pick stroke size:
                    </label>
                    <Slider
                        min={2}
                        max={50}
                        value={strokeSize}
                        onChange={(value: any) => {
                            setStrokeSize(value)
                        }}
                    ></Slider>
                </div>
            )}

            <div className="grid grid-cols-3 w-full gap-4 justify-start pt-4">
                <button
                    className="btn p-2 text-sm font-medium text-black bg-blue-400 hover:bg-blue-600 rounded-lg text-center capitalize normal-case"
                    onClick={() => {
                        if (processing) {
                            window.alarm_processing.showModal()
                            return
                        }

                        if (data) {
                            if (
                                generateMode === "generate" ||
                                generateMode === "generateLayout" ||
                                generateMode === "generateShuffle"
                            ) {
                                if (interactiveMode === 'draw-scribble' && strokePoints.length === 0) {
                                    window.alarm_no_stroke.showModal()
                                    return
                                }
                                handleGenerateEdit()
                                return
                            } else if (
                                generateMode === "edit" &&
                                interactiveMode === "manual"
                            ) {
                                strokePoints.length > 0
                                    ? handleGenerateEdit()
                                    : window.alarm_no_stroke.showModal()
                            } else if (generateMode === "edit") {
                                masks.length > 0
                                    ? handleGenerateEdit()
                                    : window.alarm_no_mask.showModal()
                            } else {
                                strokePoints.length > 0
                                    ? handleGenerateEdit()
                                    : window.alarm_no_stroke.showModal()
                            }
                        } else {
                            layoutType === "None"
                                ? handleGenerateEdit()
                                : window.alarm_no_data.showModal()
                        }
                    }}
                >
                    Generate
                </button>

                <dialog id="alarm_processing" className="modal">
                    <form method="dialog" className="modal-box">
                        <h3 className="font-bold text-lg">
                            Your task is being processed.
                        </h3>
                        <p className="py-4">
                            Please wait for the processing to complete before performing
                            any further actions!
                        </p>
                    </form>
                    <form method="dialog" className="modal-backdrop">
                        <button>close</button>
                    </form>
                </dialog>

                <dialog id="alarm_no_data" className="modal">
                    <form method="dialog" className="modal-box">
                        <h3 className="font-bold text-lg">No uploaded image!</h3>
                        <p className="py-4">
                            Please upload an image first when using this design mode!
                        </p>
                    </form>
                    <form method="dialog" className="modal-backdrop">
                        <button>close</button>
                    </form>
                </dialog>

                <dialog id="alarm_no_mask" className="modal">
                    <form method="dialog" className="modal-box">
                        <h3 className="font-bold text-lg">No selected object!</h3>
                        <p className="py-4">
                            You need to select at least one object when using this design
                            mode!
                        </p>
                    </form>
                    <form method="dialog" className="modal-backdrop">
                        <button>close</button>
                    </form>
                </dialog>

                <dialog id="alarm_no_stroke" className="modal">
                    <form method="dialog" className="modal-box">
                        <h3 className="font-bold text-lg">No drawn stroke!</h3>
                        <p className="py-4">
                            You need to draw at least one stroke when using this design
                            mode!
                        </p>
                    </form>
                    <form method="dialog" className="modal-backdrop">
                        <button>close</button>
                    </form>
                </dialog>

                {/* <button
                    className="btn p-2 text-sm font-medium text-black bg-blue-400 hover:bg-blue-600 rounded-lg text-center capitalize normal-case"
                    onClick={uploadImage}
                >
                    Upload image
                </button> */}

                {generateMode === "edit" && (
                    <button
                        className="btn p-2 text-sm font-medium text-black bg-blue-400 hover:bg-blue-600 rounded-lg text-center capitalize normal-case"
                        onClick={clearSegs}
                    >
                        Clear masks
                    </button>
                )}
                
                {(generateMode === "generate" && (interactiveMode === "edit-sketch" || interactiveMode === "draw-scribble")) && (
                    <button
                        className="btn p-2 text-sm font-medium text-black bg-blue-400 hover:bg-blue-600 rounded-lg text-center capitalize normal-case"
                        onClick={clearSegs}
                    >
                        Clear strokes
                    </button>
                )}

                {(generateMode === "editStroke" || generateMode === "editStrokeFull") && (
                    <button
                        className="btn p-2 text-sm font-medium text-black bg-blue-400 hover:bg-blue-600 rounded-lg text-center capitalize normal-case"
                        onClick={clearSegs}
                    >
                        Clear strokes
                    </button>
                )}

                <button
                    className="btn p-2 text-sm font-medium text-black bg-blue-400 hover:bg-blue-600 rounded-lg text-center capitalize normal-case"
                    onClick={clearAll}
                >
                    Clear all
                </button>
            </div>
        </div>
    )
}

function GenerateModeDropDown({
    generateMode,
    setGenerateMode,
}: {
    generateMode: string
    setGenerateMode: (mode: "generate" | "generateLayout" | "generateShuffle" | "edit" | "editStroke" | "editStrokeFull") => void
}) {
    return (
        <div>
            <label className="block mb-2 text-lg font-medium text-black">
                Choose design mode:
            </label>
            <select
                className="select w-full max-w-xs"
                onChange={(e) => {
                    setGenerateMode(
                        e.target.value as
                            | "generate"
                            | "generateLayout"
                            | "generateShuffle"
                            | "edit"
                            | "editStroke"
                            // | "editStrokeFull"
                    )
                }}
            >
                <option className="px-3 py-2 text-sm rounded-md" value="generate">
                    Generate new room
                </option>
                <option className="px-3 py-2 text-sm rounded-md" value="generateLayout">
                    Change room&apos;s style
                </option>
                {/* <option className="px-3 py-2 text-sm rounded-md" value="generateShuffle">
                    Change room&apos;s layout
                </option> */}
                <option className="px-3 py-2 text-sm rounded-md" value="edit">
                    Edit room with masks (beta)
                </option>
                <option className="px-3 py-2 text-sm rounded-md" value="editStroke">
                    Edit room with strokes (beta)
                </option>
                {/* <option className="px-3 py-2 text-sm rounded-md" value="editStrokeFull">
                    Edit room with strokes 2
                </option> */}
            </select>
        </div>
    )
}
// Error 170:32: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rs
function GenerateTab({
    layoutType,
    setLayoutType,
    setInteractiveMode,
    setData
}: {
    layoutType: string
    setLayoutType: (layoutType: "None" | "canny" | "depth" | "stroke" | "mlsd" | 'scribble') => void
    setInteractiveMode: (
        mode: "click" | "box" | "everything" | "stroke" | "manual" | "edit-sketch" | 'draw-scribble'
    ) => void
    setData: (data: any) => void
}) {
    useEffect(() => {
        setLayoutType("None")
        setInteractiveMode("everything")
    }, [])


    // force whiteboard
    const setupWhiteBoard = () => {
        // read image from file path
        const boardPath = "/toolbar/board.png"
        const boardImg = new Image()
        boardImg.src = boardPath
        boardImg.onload = () => {
            const newData = {
                width: boardImg.width,
                height: boardImg.height,
                file: null,
                img: boardImg
            }
            setData(newData)
        }
    }

    return (
        <div className="flex flex-col gap-4">
            <div>
                <label className="label">
                    <span className="label-text text-lg font-medium text-black">
                        Choose layout type:
                    </span>
                </label>

                <div className="grid grid-cols-2 w-full gap-4 justify-evenly">
                    <button
                        style={{
                            margin: "auto"
                        }}
                        className={
                            (layoutType === "None"
                                ? "opacity-100 "
                                : "opacity-50 hover:opacity-80 ") + "w-10/12"
                        }
                        onClick={() => {
                            setLayoutType("None")
                            setInteractiveMode("everything")
                        }}
                    >
                        <div className="card card-compact border-none w-full bg-base-100 shadow-xl">
                            <figure>
                                <img
                                    src={"/toolbar/text.png"}
                                    alt=""
                                    placeholder="blur"
                                    className="rounded-lg"
                                />
                            </figure>
                            <div className="card-body items-center text-center">
                                <p>Only text</p>
                            </div>
                        </div>
                    </button>

                    <button
                        style={{
                            margin: "auto"
                        }}
                        className={
                            (layoutType === "scribble"
                                ? "opacity-100 "
                                : "opacity-50 hover:opacity-80 ") + "w-10/12"
                        }
                        onClick={() => {
                            setupWhiteBoard()
                            setLayoutType("scribble")
                            setInteractiveMode("draw-scribble")
                        }}
                    >
                        <div className="card card-compact border-none w-full bg-base-100 shadow-xl">
                            <figure>
                                <img
                                    src={"/toolbar/scribble.png"}
                                    alt=""
                                    placeholder="blur"
                                />
                            </figure>
                            <div className="card-body items-center text-center">
                                <p>Draw scribbles</p>
                            </div>
                        </div>
                    </button>

                    <button
                        style={{
                            margin: "auto"
                        }}
                        className={
                            (layoutType === "canny"
                                ? "opacity-100 "
                                : "opacity-50 hover:opacity-80 ") + "w-10/12"
                        }
                        onClick={() => {
                            setLayoutType("canny")
                            setInteractiveMode("edit-sketch")
                        }}
                    >
                        <div className="card card-compact border-none w-full bg-base-100 shadow-xl">
                            <figure>
                                <img
                                    src={"/toolbar/line.png"}
                                    alt=""
                                    placeholder="blur"
                                />
                            </figure>
                            <div className="card-body items-center text-center">
                                <p>Draw on sketch image</p>
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    )
}

function GenerateLayoutTab({
    layoutType,
    setLayoutType,
    setInteractiveMode,
}: {
    layoutType: string
    setLayoutType: (layoutType: "None" | "canny" | "depth" | "stroke" | "mlsd" | "blur") => void
    setInteractiveMode: (
        mode: "click" | "box" | "everything" | "stroke" | "manual" | "edit-sketch"
    ) => void
}) {
    useEffect(() => {
        setLayoutType("canny")
        setInteractiveMode("everything")
    }, [])

    return (
        <div>
            <label className="label">
                <span className="label-text text-lg font-medium text-black">
                    Choose layout type:
                </span>
            </label>

            <div className="grid grid-cols-2 w-full gap-4 justify-evenly">
                <button
                    style={{
                        margin: "auto"
                    }}
                    className={
                        (layoutType === "canny"
                            ? "opacity-100 "
                            : "opacity-50 hover:opacity-80 ") + "w-10/12"
                    }
                    onClick={() => {
                        setLayoutType("canny")
                    }}
                >
                    <div className="card card-compact border-none w-full bg-base-100 shadow-xl">
                        <figure>
                            <img
                                src={"/toolbar/gradients.png"}
                                alt=""
                                placeholder="blur"
                            />
                        </figure>
                        <div className="card-body items-center text-center">
                            <p>Image gradients</p>
                        </div>
                    </div>
                </button>

                <button
                    style={{
                        margin: "auto"
                    }}
                    className={
                        (layoutType === "depth"
                            ? "opacity-100 "
                            : "opacity-50 hover:opacity-80 ") + "w-10/12"
                    }
                    onClick={() => {
                        setLayoutType("depth")
                    }}
                >
                    <div className="card card-compact border-none w-full bg-base-100 shadow-xl">
                        <figure>
                            <img src={"/toolbar/depth.png"} alt="" placeholder="blur" />
                        </figure>
                        <div className="card-body items-center text-center">
                            <p>Depth information</p>
                        </div>
                    </div>
                </button>

                <button
                    style={{
                        margin: "auto"
                    }}
                    className={
                        (layoutType === "mlsd"
                            ? "opacity-100 "
                            : "opacity-50 hover:opacity-80 ") + "w-10/12"
                    }
                    onClick={() => {
                        setLayoutType("mlsd")
                    }}
                >
                    <div className="card card-compact border-none w-full bg-base-100 shadow-xl">
                        <figure>
                            <img src={"/toolbar/line.png"} alt="" placeholder="blur" />
                        </figure>
                        <div className="card-body items-center text-center">
                            <p>Line sketch</p>
                        </div>
                    </div>
                </button>
            </div>
        </div>
    )
}

function GenerateShuffleTab({
    layoutType,
    setLayoutType,
    setInteractiveMode,
}: {
    layoutType: string
    setLayoutType: (layoutType: "None" | "canny" | "depth" | "stroke" | "mlsd" | "blur") => void
    setInteractiveMode: (
        mode: "click" | "box" | "everything" | "stroke" | "manual" | "edit-sketch"
    ) => void
}) {
    useEffect(() => {
        setLayoutType("blur")
        setInteractiveMode("everything")
    }, [])

    return (
        <div>
            <label className="label">
                <span className="label-text text-lg font-medium text-black">
                    Shuffle the layout with:
                </span>
            </label>

            <div className="grid grid-cols-2 w-full gap-4 justify-evenly">
                <button
                    style={{
                        margin: "auto"
                    }}
                    className={
                        (layoutType === "blur"
                            ? "opacity-100 "
                            : "opacity-50 hover:opacity-80 ") + "w-10/12"
                    }
                    onClick={() => {
                        setLayoutType("blur")
                    }}
                >
                    <div className="card card-compact border-none w-full bg-base-100 shadow-xl">
                        <figure>
                            <img src={"/toolbar/blur.png"} alt="" placeholder="blur" />
                        </figure>
                        <div className="card-body items-center text-center">
                            <p>Blurred effect</p>
                        </div>
                    </div>
                </button>

                <button
                    style={{
                        margin: "auto"
                    }}
                    className={
                        (layoutType === "stroke"
                            ? "opacity-100 "
                            : "opacity-50 hover:opacity-80 ") + "w-10/12"
                    }
                    onClick={() => {
                        setLayoutType("stroke")
                    }}
                >
                    <div className="card card-compact border-none w-full bg-base-100 shadow-xl">
                        <figure>
                            <img src={"/toolbar/painting.png"} alt="" placeholder="painting" />
                        </figure>
                        <div className="card-body items-center text-center">
                            <p>Colorful strokes</p>
                        </div>
                    </div>
                </button>
            </div>
        </div>
    )
}

function EditTab({
    layoutType,
    setLayoutType,
    interactiveMode,
    setInteractiveMode,
    strokeSize,
    setStrokeSize,
}: {
    layoutType: string
    setLayoutType: (layoutType: "None" | "canny" | "depth" | "stroke" | "mlsd") => void
    interactiveMode: string
    setInteractiveMode: (
        mode: "click" | "box" | "everything" | "stroke" | "manual" | "edit-sketch"
    ) => void
    strokeSize: number
    setStrokeSize: (strokeSize: number) => void
}) {
    useEffect(() => {
        setLayoutType("None")
        setInteractiveMode("click")
    }, [])

    return (
        <div className="flex flex-col gap-4">
            <div>
                <label className="label">
                    <span className="label-text text-lg font-medium text-black">
                        Choose layout type:
                    </span>
                </label>

                <div className="grid grid-cols-2 w-full gap-4 justify-evenly">
                    <button
                        className={
                            (layoutType === "None"
                                ? "opacity-100 "
                                : "opacity-50 hover:opacity-80 ") + "w-10/12"
                        }
                        onClick={() => {
                            setLayoutType("None")
                        }}
                    >
                        <div className="card card-compact border-none w-full bg-base-100 shadow-xl">
                            <figure>
                                <img
                                    src={"/toolbar/text.png"}
                                    alt=""
                                    placeholder="blur"
                                    className="rounded-lg"
                                />
                            </figure>
                            <div className="card-body items-center text-center">
                                <p>Only text</p>
                            </div>
                        </div>
                    </button>

                    <button
                        className={
                            (layoutType === "canny"
                                ? "opacity-100 "
                                : "opacity-50 hover:opacity-80 ") + "w-10/12"
                        }
                        onClick={() => {
                            setLayoutType("canny")
                        }}
                    >
                        <div className="card card-compact border-none w-full bg-base-100 shadow-xl">
                            <figure>
                                <img
                                    src={"/toolbar/gradients.png"}
                                    alt=""
                                    placeholder="blur"
                                />
                            </figure>
                            <div className="card-body items-center text-center">
                                <p>Image gradients</p>
                            </div>
                        </div>
                    </button>

                    <button
                        className={
                            (layoutType === "depth"
                                ? "opacity-100 "
                                : "opacity-50 hover:opacity-80 ") + "w-10/12"
                        }
                        onClick={() => {
                            setLayoutType("depth")
                        }}
                    >
                        <div className="card card-compact border-none w-full bg-base-100 shadow-xl">
                            <figure>
                                <img
                                    src={"/toolbar/depth.png"}
                                    alt=""
                                    placeholder="blur"
                                />
                            </figure>
                            <div className="card-body items-center text-center">
                                <p>Depth information</p>
                            </div>
                        </div>
                    </button>

                    <button
                        className={
                            (layoutType === "mlsd"
                                ? "opacity-100 "
                                : "opacity-50 hover:opacity-80 ") + "w-10/12"
                        }
                        onClick={() => {
                            setLayoutType("mlsd")
                        }}
                    >
                        <div className="card card-compact border-none w-full bg-base-100 shadow-xl">
                            <figure>
                                <img
                                    src={"/toolbar/line.png"}
                                    alt=""
                                    placeholder="blur"
                                />
                            </figure>
                            <div className="card-body items-center text-center">
                                <p>Line sketch</p>
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            <div className="join w-full pt-4">
                <button
                    onClick={() => {
                        setInteractiveMode("click")
                    }}
                    className="w-1/2 join-item btn btn-active normal-case text-md"
                >
                    Automatically choose object
                </button>
                <button
                    onClick={() => {
                        setInteractiveMode("manual")
                    }}
                    className="w-1/2 join-item btn normal-case text-md"
                >
                    Manually mask object
                </button>
            </div>

            {interactiveMode !== "manual" && (
                <div>
                    <label className="label">
                        <span className="label-text text-lg font-medium text-black">
                            Choose object with:
                        </span>
                    </label>
                    <select
                        className="select w-full max-w-xs"
                        onChange={(e) => {
                            setInteractiveMode(
                                e.target.value as
                                    | "click"
                                    | "box"
                                    | "everything"
                                    | "stroke"
                                    | "manual"
                            )
                        }}
                    >
                        <option className="px-3 py-2 text-sm rounded-md" value="click">
                            Clicking
                        </option>
                        <option className="px-3 py-2 text-sm rounded-md" value="box">
                            Drawing bounding box
                        </option>
                    </select>
                </div>
            )}

            {interactiveMode === "manual" && (
                <div>
                    <label className="label">
                        <span className="label-text text-lg font-medium text-black">
                            Pick stroke size:
                        </span>
                    </label>
                    <Slider
                        min={20}
                        max={100}
                        value={strokeSize}
                        onChange={(value: any) => {
                            setStrokeSize(value)
                        }}
                    ></Slider>
                </div>
            )}
        </div>
    )
}

function EditStrokeTab({
    layoutType,
    setLayoutType,
    setInteractiveMode,
    strokeSize,
    setStrokeSize,
    strokeColor,
    setStrokeColor,
}: {
    layoutType: string
    setLayoutType: (layoutType: "None" | "canny" | "depth" | "stroke" | "mlsd") => void
    setInteractiveMode: (
        mode: "click" | "box" | "everything" | "stroke" | "edit-sketch"
    ) => void
    strokeSize: number
    setStrokeSize: (strokeSize: number) => void
    strokeColor: string
    setStrokeColor: (strokeColor: string) => void
}) {
    useEffect(() => {
        setLayoutType("None")
        setInteractiveMode("stroke")
    }, [])

    return (
        <div className="flex flex-col gap-4">
            <div>
                <label className="label">
                    <span className="label-text text-lg font-medium text-black">
                        Choose layout type:
                    </span>
                </label>

                <div className="grid grid-cols-2 w-full gap-4 justify-evenly">
                    <button
                        className={
                            (layoutType === "None"
                                ? "opacity-100 "
                                : "opacity-50 hover:opacity-80 ") + "w-10/12"
                        }
                        onClick={() => {
                            setLayoutType("None")
                        }}
                    >
                        <div className="card card-compact border-none w-full bg-base-100 shadow-xl">
                            <figure>
                                <img
                                    src={"/toolbar/text.png"}
                                    alt=""
                                    placeholder="blur"
                                    className="rounded-lg"
                                />
                            </figure>
                            <div className="card-body items-center text-center">
                                <p>Only text</p>
                            </div>
                        </div>
                    </button>

                    <button
                        className={
                            (layoutType === "canny"
                                ? "opacity-100 "
                                : "opacity-50 hover:opacity-80 ") + "w-10/12"
                        }
                        onClick={() => {
                            setLayoutType("canny")
                        }}
                    >
                        <div className="card card-compact border-none w-full bg-base-100 shadow-xl">
                            <figure>
                                <img
                                    src={"/toolbar/gradients.png"}
                                    alt=""
                                    placeholder="blur"
                                />
                            </figure>
                            <div className="card-body items-center text-center">
                                <p>Image gradients</p>
                            </div>
                        </div>
                    </button>

                    <button
                        className={
                            (layoutType === "depth"
                                ? "opacity-100 "
                                : "opacity-50 hover:opacity-80 ") + "w-10/12"
                        }
                        onClick={() => {
                            setLayoutType("depth")
                        }}
                    >
                        <div className="card card-compact border-none w-full bg-base-100 shadow-xl">
                            <figure>
                                <img
                                    src={"/toolbar/depth.png"}
                                    alt=""
                                    placeholder="blur"
                                />
                            </figure>
                            <div className="card-body items-center text-center">
                                <p>Depth information</p>
                            </div>
                        </div>
                    </button>

                    <button
                        className={
                            (layoutType === "mlsd"
                                ? "opacity-100 "
                                : "opacity-50 hover:opacity-80 ") + "w-10/12"
                        }
                        onClick={() => {
                            setLayoutType("mlsd")
                        }}
                    >
                        <div className="card card-compact border-none w-full bg-base-100 shadow-xl">
                            <figure>
                                <img
                                    src={"/toolbar/line.png"}
                                    alt=""
                                    placeholder="blur"
                                />
                            </figure>
                            <div className="card-body items-center text-center">
                                <p>Line sketch</p>
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            <div>
                <label className="label">
                    <span className="label-text text-lg font-medium text-black">
                        Pick stroke size:
                    </span>
                </label>
                <Slider
                    min={20}
                    max={100}
                    value={strokeSize}
                    onChange={(value: any) => {
                        setStrokeSize(value)
                    }}
                ></Slider>
            </div>

            <div>
                <label className="label">
                    <span className="label-text text-lg font-medium text-black">
                        Pick stroke color:
                    </span>
                </label>
                <SketchPicker
                    color={strokeColor}
                    disableAlpha={true}
                    // change strokeColor to the color user picked
                    onChangeComplete={(color: any) => {
                        // set state with callback function
                        setStrokeColor(color.hex)
                    }}
                ></SketchPicker>
            </div>
        </div>
    )
}


function EditStrokeFullTab({
    layoutType,
    setLayoutType,
    setInteractiveMode,
    strokeSize,
    setStrokeSize,
    strokeColor,
    setStrokeColor,
}: {
    layoutType: string
    setLayoutType: (layoutType: "None" | "canny" | "depth" | "stroke" | "mlsd") => void
    setInteractiveMode: (
        mode: "click" | "box" | "everything" | "stroke" | "edit-sketch"
    ) => void
    strokeSize: number
    setStrokeSize: (strokeSize: number) => void
    strokeColor: string
    setStrokeColor: (strokeColor: string) => void
}) {
    useEffect(() => {
        setLayoutType("None")
        setInteractiveMode("stroke")
    }, [])

    return (
        <div className="flex flex-col gap-4">
            <div>
                <label className="label">
                    <span className="label-text text-lg font-medium text-black">
                        Pick stroke size:
                    </span>
                </label>
                <Slider
                    min={20}
                    max={100}
                    value={strokeSize}
                    onChange={(value: any) => {
                        setStrokeSize(value)
                    }}
                ></Slider>
            </div>

            <div>
                <label className="label">    
                    <span className="label-text text-lg font-medium text-black">
                        Pick stroke color:
                    </span>
                </label>
                <SketchPicker
                    color={strokeColor}
                    disableAlpha={true}
                    // change strokeColor to the color user picked
                    onChangeComplete={(color: any) => {
                        // set state with callback function
                        setStrokeColor(color.hex)
                    }}
                ></SketchPicker>
            </div>
        </div>
    )
}
