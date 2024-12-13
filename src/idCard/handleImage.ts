import {buildAPDU} from "../utils/buildApdu";
import {selectFile} from "./selectFile";
import {readImage} from "./readImage";


//@ts-ignore
export async function handleImage(pcsc, reader, protocol): Promise<string> {
    const imageDataLocation = Buffer.from([0x0F, 0x06])

    const imageDataLocationApdu = await buildAPDU(0x00, 0xA4, 0x08, 0x00, imageDataLocation, 4)

    //select file

    await selectFile(reader, protocol, imageDataLocationApdu)


    //generate read file apu
    const readSize = Math.min(4, 0xFF)
    const apu = await buildAPDU(0x00, 0xB0, (0xFF00 & 0) >> 8, 0 & 0xFF, [], readSize)


    //read file

    console.log('dodjem do generisanja image data')
    console.log('LOGUJEM sliku')

    return await readImage(reader, apu, protocol);


}