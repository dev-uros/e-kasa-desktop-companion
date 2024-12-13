import log from "electron-log/main";
import {initCard} from "../utils/initCard";
import {handleCardData} from "./handleCardData";
import {handlePersonalData} from "./handlePersonalData";
import {handleResidenceData} from "./handleResidenceData";
import {handleImage} from "./handleImage";
import {CardData, CardType, IDDocumentData, IDPersonalData, IDResidenceData} from "../types/types";

//@ts-ignore
export async function handleIDCard(pcsc, reader, protocol) {

    log.info('Protocol(', reader.name, '):', protocol)

    log.info('Initializing MED card')
    await initCard(pcsc, reader, protocol);


    //HANDLE CARD DATA
    log.info('Reading Card Data')
    const cardData = await handleCardData(pcsc, reader, protocol)


    //HANDLE PERSONAL DATA
    log.info('Reading Personal Data')

    const personalData = await handlePersonalData(pcsc, reader, protocol)


    //HANDLE RESIDENCE DATA
    log.info('Reading Residence Data')
    const residenceData = await handleResidenceData(pcsc, reader, protocol)


    //HANDLE IMAGE
    // log.info('Reading Image Data')

    // const image = await handleImage(pcsc, reader, protocol)

    log.info('Formatting card data')

    return formatAllCardData(cardData, personalData, residenceData);
}


function formatAllCardData(cardData: IDDocumentData, personalData: IDPersonalData, residenceData: IDResidenceData): CardData {
    return {
        cardType: CardType.ID_CARD,
        documentData: {
            DocumentNumber: cardData.DocumentNumber,
            DocumentType: cardData.DocumentType,
            DocumentSerialNumber: cardData.DocumentSerialNumber,
            IssuingDate: cardData.IssuingDate,
            ExpiryDate: cardData.ExpiryDate,
            IssuingAuthority: cardData.IssuingAuthority
        },
        personalData: {
            PersonalNumber: personalData.PersonalNumber,
            Surname: personalData.Surname,
            GivenName: personalData.GivenName,
            ParentGivenName: personalData.ParentGivenName,
            Sex: personalData.Sex,
            PlaceOfBirth: personalData.PlaceOfBirth,
            CommunityOfBirth: personalData.CommunityOfBirth,
            StateOfBirth: personalData.StateOfBirth,
            DateOfBirth: personalData.DateOfBirth
        },
        residenceData: {
            State: residenceData.State,
            Community: residenceData.Community,
            Place: residenceData.Place,
            Street: residenceData.Street,
            AddressNumber: residenceData.AddressNumber,
            AddressLetter: residenceData.AddressLetter,
            AddressEntrance: residenceData.AddressEntrance,
            AddressFloor: residenceData.AddressFloor,
            AddressApartmentNumber: residenceData.AddressApartmentNumber,
            AddressDate: residenceData.AddressDate
        },
    }
}
