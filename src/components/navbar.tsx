import { useState } from "react"
import Link from "next/link";
declare const window: any;


const genWithTextImages = require.context('../../public/tutorial/generate', true);
const genWithTextImageNames = genWithTextImages.keys().map((item: string) => item.replace('./', ''));
const genWithTextLabels = [
    'Choose "Generate new room" mode',
    'Describe how you want your to look like',
    'Choose a layout type.\n    - Only text: Generate image from your description only\n    - Sketch image: Generate image from your description and your layout guidance',
    '(Optional) If the type "Sketch image" is selected, you need to upload your sketch image or pick one from the gallery',
    'Click "Generate"'
]

const genWithLayoutImages = require.context('../../public/tutorial/generateLayout', true);
const genWithLayoutImageNames = genWithLayoutImages.keys().map((item: string) => item.replace('./', ''));
const genWithLayoutLabels = [
    'Choose "Change room\'s style" mode',
    'Upload your image, or select from the gallery',
    'Describe the new style for your room',
    'Choose a layout type:\n    - Image gradients: The details of the shapes in the original image are preserved.\n    - Depth information: The depth of the objects is preserved, and the system will be slightly more creative.\n    - Line sketch: Only the straight lines in the image are preserved, allowing the system to be more creative.',
    'Click "Generate"'
]

const editWithLayoutImages = require.context('../../public/tutorial/edit', true);
const editWithLayoutImageNames = editWithLayoutImages.keys().map((item: string) => item.replace('./', ''));
const editWithLayoutLabels = [
    'Choose "Edit room with masks"',
    'Upload your image, or select from the gallery',
    'Describe what you want to edit.\n    - For changing object, you should provide the details of the new object.\n    - For removing object, you should describe the background of the object that you want to remove, such as wall, floor, ceiling...',
    'Choose a layout mode. Choose "Only text" if you don\'t want to keep the original shape of the objects, otherwise:\n    - Image gradients: The details of the shapes of the objects are preserved.\n    - Depth information: The depth of the objects is preserved.\n    - Line sketch: The straight lines of the objects are preserved.',
    'Choose object / area that you want to edit:\n    - Automatic:\n        + Clicking: click on the object that you want to edit\n        + Bounding box: click and then drag to cover the object that you want to edit\n    - Manual: draw the mask on the object that you want to edit',
    'To achieve better results:\n    - The masks should have a simple shape (such as square, circle, oval, etc.)\n    - The masks should not overfit the the object',
    'Click "Generate"'
]

const editWithStrokeImages = require.context('../../public/tutorial/editStroke', true);
const editWithStrokeImageNames = editWithStrokeImages.keys().map((item: string) => item.replace('./', ''));
const editWithStrokeLabels = [
    'Choose "Edit room with strokes"',
    'Upload your image, or select from the gallery',
    'Describe what you want to edit. The description should avoid contradictions with the strokes you are about to draw.',
    'Choose a layout mode. Choose "Only text" if you don\'t want to keep the original shape of the objects, otherwise:\n    - Image gradients: The details of the shapes of the objects are preserved.\n    - Depth information: The depth of the objects is preserved.\n    - Line sketch: The straight lines of the objects are preserved.',
    'Pick stroke color and size',
    'Draw strokes. Note that only the regions you draw on are edited.\nCurrently, the system works fine when you use warm colors (red, orange, yellow, etc.) or white.\nCool colors (green, blue) mostly produce undesirable results.',
    'Click "Generate"'
]

const indoorStyleImages = require.context('../../public/tutorial/indoorStyle', true);
const indoorStyleImageNames = indoorStyleImages.keys().map((item: string) => item.replace('./', ''));
const indoorStyleInfos = [
    {
        style: 'Bohemian style',
        colors: 'warm, earthy, jewel tones',
        materials: 'natural fibers, rattan, and vintage textiles',
        feelings: 'eclectic, free-spirited, inviting'
    },
    {
        style: 'Color block style',
        colors: 'bold, contrasting, vibrant colors (red, orange, yellow, blue)',
        materials: 'colorful furniture, décor, art',
        feelings: 'energetic, fun, playful'
    },
    {
        style: 'Contemporary style',
        colors: 'warm neutrals, monochromatic',
        materials: 'glass, metal, wood',
        feelings: 'warm and inviting'
    },
    {
        style: 'Eclectic style',
        colors: 'diverse, bold, vibrant',
        materials: 'mix-and-match, varied, artistic',
        feelings: 'creative, playful'
    },
    {
        style: 'Indochine style',
        colors: 'light yellow, cream yellow, white',
        materials: 'cement tiles, wood',
        feelings: 'serene, peaceful'
    },
    {
        style: 'Industrial style',
        colors: 'raw, earthy',
        materials: 'exposed brick, concrete, metal',
        feelings: 'urban'
    },
    {
        style: 'Japandi style',
        colors: 'light neutrals (beige, grey, taupes, creams, whites)',
        materials: 'natural fibers, hand-made pottery, décor, rattan, wicker, bamboo, cane, wood',
        feelings: 'cozy, calming and comfortable'
    },
    {
        style: 'Mid century modern style',
        colors: 'warm, retro, earthy',
        materials: 'teak wood, plywood, steel',
        feelings: 'nostalgic, timeless'
    },
    {
        style: 'Minimalism style',
        colors: 'neutral, monochromatic',
        materials: 'glass, steel',
        feelings: 'simple, modern, clean'
    },
    {
        style: 'Modern style',
        colors: 'neutral, bold, contrasting',
        materials: 'glass, metal, leather',
        feelings: 'sophisticated, contemporary'
    },
    {
        style: 'Neoclassical style',
        colors: 'ivory white, deep gold, royal blue',
        materials: 'marble, bronze, silk',
        feelings: 'elegant, luxurious'
    },
    {
        style: 'Scandinavian style',
        colors: 'white, light gray, pastel hues',
        materials: 'light wood, natural fibers, clean metals',
        feelings: 'cozy, airy'
    },
    {
        style: 'Victorian style',
        colors: 'rich jewel tones, deep reds, and dark greens',
        materials: 'ornate wood carvings, plush fabrics, stained glass',
        feelings: 'opulent, luxurious, nostalgic'
    },
    {
        style: 'Shabby chic style',
        colors: 'soft pastels (light pink, mint green, pale blue), vintage whites, and muted neutrals',
        materials: 'distressed wood, vintage décor, floral patterns',
        feelings: 'romantic, feminine'
    },
    {
        style: 'Coastal style',
        colors: 'soft blues, sandy beige, white, and aqua/teal tones',
        materials: 'natural fibers (rattan and wicker), light-colored woods, and weathered finishes',
        feelings: 'relaxed, breezy, and refreshing'
    },
    {
        style: 'Rustic style',
        colors: 'earthy tones (warm browns, deep reds, forest greens), natural hues (beige, cream)',
        materials: 'wood, stone, natural fabrics, wrought iron',
        feelings: 'warm, cozy, inviting'
    },
    {
        style: 'Art deco style',
        colors: 'bold and rich colors (deep blues, emerald greens, gold, black)',
        materials: 'glossy finishes, lacquered wood, mirrored surfaces, chrome accents',
        feelings: 'glamorous, luxurious, opulent'
    },
    {
        style: 'Zen style',
        colors: 'neutral tones (white, beige, soft grays)',
        materials: 'natural wood, bamboo, stone',
        feelings: 'calm, peaceful, relaxing'
    },
    {
        style: 'Tropical style',
        colors: 'bright, vibrant colors (turquoise, coral, sunny yellow, lush green)',
        materials: 'natural fibers, bamboo, teak wood, light fabrics',
        feelings: 'relaxed, tropical paradise'
    },
    {
        style: 'Mediterranean style',
        colors: 'warm, earthy tones (beige, brown, yellow, orange)',
        materials: 'natural stone (limestone, marble), terra cotta tiles, wrought iron, and ceramics',
        feelings: 'warm, inviting, rustic'
    },
    {
        style: 'Gothic style',
        colors: 'dark, rich colors (velvety black, deep purple, burgundy)',
        materials: 'heavy and ornate materials (dark wood, velvet, wrought iron, stained glass)',
        feelings: 'dramatic, mysterious, elegant'
    }
]

export function Navbar() {

    return (
        <div className="navbar bg-base-100">
            <div className="flex-none">
                <Link href="/" className="btn btn-ghost normal-case text-2xl">Rinterior</Link>
            </div>
            <div className="flex-none">
                <ul className="menu menu-horizontal px-1">
                    <li><a className="text-xl" onClick={() => window.tutorial_window.showModal()}>Tutorial</a></li>
                    <TutorialWindow id="tutorial_window" />

                    <li><a className="text-xl" href="https://forms.gle/yasWqnf8TT2qroUu8" target="_blank">Survey</a></li>
                </ul>
            </div>
        </div>
    )
}

function TutorialWindow({ id }: { id: string }) {

    const [tutMode, setTutMode] = useState<'generate' | 'generateLayout' | 'edit' | 'editStroke' | 'indoorStyle'>('generate')

    return (
        <dialog id={id} className="modal">
            <form method="dialog" className="modal-box w-11/12 max-w-5xl">
                <div className="form-control w-full max-w-xs mx-2 mb-4">
                    <label className="label">
                        <span className="label-text font-bold">Pick what you want to learn</span>
                    </label>
                    <select className="select select-bordered" onChange={(e) => { setTutMode(e.target.value as 'generate' | 'generateLayout' | 'edit' | 'editStroke' | 'indoorStyle') }}>
                        <option value='generate'>Generate new room</option>
                        <option value='generateLayout'>Change room&apos;s style</option>
                        <option value='edit'>Edit room with masks (beta)</option>
                        <option value='editStroke'>Edit room with strokes (beta)</option>
                        <option value='indoorStyle'>Common indoor design styles</option>
                    </select>
                </div>

                {tutMode === 'generate' && <TutorialItem folderName={tutMode} imageNames={genWithTextImageNames} labels={genWithTextLabels}/>}
                {tutMode === 'generateLayout' && <TutorialItem folderName={tutMode} imageNames={genWithLayoutImageNames} labels={genWithLayoutLabels}/>}
                {tutMode === 'edit' && <TutorialItem folderName={tutMode} imageNames={editWithLayoutImageNames} labels={editWithLayoutLabels}/>}
                {tutMode === 'editStroke' && <TutorialItem folderName={tutMode} imageNames={editWithStrokeImageNames} labels={editWithStrokeLabels}/>}
                {tutMode === 'indoorStyle' && <IndoorStyleItem folderName={tutMode} imageNames={indoorStyleImageNames} styles={indoorStyleInfos}/>}


            </form>
            <form method="dialog" className="modal-backdrop">
                <button></button>
            </form>
        </dialog>
    )
}


function TutorialItem({ folderName, imageNames, labels }: { folderName: string, imageNames: string[], labels: string[] }) {

    const [activeIndex, setActiveIndex] = useState(-1)

    return (
        <div>
            {imageNames.map((imageName: string, index: number) => (
                <div key={index} className="collapse collapse-arrow bg-base-200 m-2">
                    <input type="radio" name="my-accordion-2" checked={activeIndex === index} onChange={() => setActiveIndex(index)} />
                    
                    <div className="collapse-title text-md font-bold" style={{ whiteSpace: "pre" }}>
                        Step {index + 1}: {labels[index]}
                    </div>

                    <div className="collapse-content">
                        <img src={`/tutorial/${folderName}/${imageName}`} alt="" className="object-cover rounded-xl" placeholder="blur"/>
                    </div>
                </div>
            )
            )}
        </div>
    )
}

function IndoorStyleItem({ folderName, imageNames, styles }: { folderName: string, imageNames: string[], styles: {style: string, colors: string, materials: string, feelings: string}[] }) {

    return (
        <div>
            <div className="grid grid-cols-3 gap-4">
                {imageNames.map((imageName: string, index: number) => (
                    <div key={index} className="card shadow-lg compact bg-base-200 m-2">

                        <div className="card-body">
                            <div className="flex flex-col items-center relative group">
                                <div className="absolute top-0 left-0 w-full h-56 bg-black bg-opacity-50 rounded-xl flex items-center justify-center invisible group-hover:visible">
                                    <div className="flex flex-col mx-4 gap-2">
                                    <div className="text-white text-md font-bold"> Main colors: {styles[index].colors}</div>
                                    <div className="text-white text-md font-bold"> Materials: {styles[index].materials}</div>
                                    <div className="text-white text-md font-bold"> Feelings: {styles[index].feelings}</div>
                                    </div>
                                   
                                </div>
                                <img src={`/tutorial/${folderName}/${imageName}`} alt="" className="object-cover rounded-xl h-56" placeholder="blur"/>
                            <div className="text-lg font-bold">{styles[index].style}</div>
                            </div>
                        </div>
                    </div>
                ))}

                        
            </div>
        </div>
    )
}