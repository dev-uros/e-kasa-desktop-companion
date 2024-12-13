import log from "electron-log/main";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export async function selectFile(reader, protocol, dataApdu) {
    return new Promise((resolve, reject) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        reader.transmit(Buffer.from(dataApdu), 1024, protocol, async (err, data) => {
            if (err) {
                log.error('Error(', reader.name, '):', err.message)

                return reject(err)
            }else{
                return resolve(true);
            }
        });
    })
}