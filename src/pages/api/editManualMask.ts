// @ts-nocheck
// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import formidable from "formidable";
import { promises as fs } from 'fs';
import FormData from 'form-data';
import * as utils from '@/utils';

export const config = {
    api: {
        bodyParser: false,
        responseLimit: false,
    }
};


export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Response>) {
    fs.mkdir('./tmp/', { recursive: true })
    // const form = formidable({ uploadDir: './tmp/', maxTotalFileSize: 1024 * 1024 })
    const form = formidable({ uploadDir: './tmp/'})
    const { fields, files } =
        await new Promise<{ fields: formidable.Fields; files: formidable.Files; }>((resolve, reject) => {
            form.parse(req, async function (err, fields, files) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve({ fields, files });
            });
        })
    const file_list = files['file'] as formidable.File[]
    const filepath = file_list[0]['filepath']
    const readStream = await fs.readFile(filepath)
    const req_data = new FormData()
    // fromData.append('masks', JSON.stringify(masks))

    req_data.append('file', readStream, 'image')
    // req_data.append('file', new Blob([readStream]), 'image')
    req_data.append('prompt', fields['prompt'][0])
    req_data.append('layout_type', fields['layout_type'][0])
    req_data.append('strokePoints', fields['strokePoints'][0] as string)
    const res_data = await fetch(
        utils.config.API_URL + '/api/editManualMask',
        {
            method: 'POST',
            body: req_data,
        }
    )
    
    const res_data_json = await res_data.json()
    res.status(200).json(res_data_json)
}
