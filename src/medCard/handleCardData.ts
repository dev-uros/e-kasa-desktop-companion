import {buildAPDU} from "../utils/buildApdu";
import log from "electron-log/main";
import {selectFile} from "./selectFile";
import {readFileDocumentData} from "./readFileDocumentData";
import {MedCardDocumentData} from "../types/types";


// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export async function handleCardData(pcsc, reader, protocol): Promise<MedCardDocumentData> {
    const cardDataLocation = Buffer.from([0x0D, 0x01])

    const cardDataLocationApdu = await buildAPDU(0x00, 0xA4, 0x00, 0x00, cardDataLocation, 0)

    //select file

    await selectFile(reader, protocol, cardDataLocationApdu)

    //generate read file apu
    const readSize = Math.min(4, 0xFF)
    const apu = await buildAPDU(0x00, 0xB0, (0xFF00 & 0) >> 8, 0 & 0xFF, [], readSize)

    //read file
    return await readFileDocumentData(reader, apu, protocol);


}