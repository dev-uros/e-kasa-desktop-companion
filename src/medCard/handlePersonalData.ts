import {buildAPDU} from "../utils/buildApdu";
import log from "electron-log/main";
import {selectFile} from "./selectFile";
import {readFilePersonalData} from "./readFilePersonalData";
import {MedCardPersonalData} from "../types/types";


// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export async function handlePersonalData(pcsc, reader, protocol): Promise<MedCardPersonalData> {
    const personalDataLocation = Buffer.from([0x0D, 0x02])

    const personalDataLocationApdu = await buildAPDU(0x00, 0xA4, 0x00, 0x00, personalDataLocation, 0)

    //select file

    await selectFile(reader, protocol, personalDataLocationApdu)

    //generate read file apu
    const readSize = Math.min(4, 0xFF)
    const apu = await buildAPDU(0x00, 0xB0, (0xFF00 & 0) >> 8, 0 & 0xFF, [], readSize)


    //read file

    console.log('dodjem do generisanja personal data')
    console.log('LOGUJEM NIZ PERSONAL DATA')

    return await readFilePersonalData(reader, apu, protocol);


}