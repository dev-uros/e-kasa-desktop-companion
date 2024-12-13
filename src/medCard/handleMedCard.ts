import log from "electron-log/main";
import {initCard} from "../utils/initCard";
import {handleCardData} from "./handleCardData";
import {initS1} from "./initS1";
import {handlePersonalData} from "./handlePersonalData";
import {handleValidityData} from "./handleValidityData";
import {handleResidenceAndInsuranceData} from "./handleResidenceAndInsuranceData";
import {
    CardType,
    MedCardData,
    MedCardDocumentData,
    MedCardPersonalData,
    MedCardResidenceAndInsuranceData,
    MedCardValidityData
} from "../types/types";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export async function handleMedCard(pcsc, reader, protocol) {

    log.info('Protocol(', reader.name, '):', protocol)

    log.info('Initializing ID card')
    await initCard(pcsc, reader, protocol);

    log.info('Initializing S1')
    await initS1(reader, protocol);

    //HANDLE CARD DATA
    log.info('Reading Card Data')
    const cardData = await handleCardData(pcsc, reader, protocol)

    console.log(cardData);

    //HANDLE PERSONAL DATA
    log.info('Reading Personal Data')

    const personalData = await handlePersonalData(pcsc, reader, protocol)

    console.log(personalData);

    //HANDLE RESIDENCE DATA
    log.info('Reading Validity Data')
    const validityData = await handleValidityData(pcsc, reader, protocol);

    console.log(validityData);

    //HANDLE IMAGE
    log.info('Reading Residence and Insurance data')

    const residenceAndInsuranceData = await handleResidenceAndInsuranceData(pcsc, reader, protocol)

    console.log(residenceAndInsuranceData);

    log.info('Formatting card data')

    return formatAllCardData(cardData, personalData, validityData, residenceAndInsuranceData);
}


function formatAllCardData(readCardData: MedCardDocumentData,
                           readPersonalData: MedCardPersonalData,
                           readValidityData: MedCardValidityData,
                           readResidenceAndInsuranceData: MedCardResidenceAndInsuranceData): MedCardData {
    return {
        cardType: CardType.MED_CARD,
        cardData: {
            InsurerName: readCardData.InsurerName,
            InsurerID: readCardData.InsurerID,
            CardId: readCardData.CardId,
            CardIssueDate: readCardData.CardIssueDate,
            CardExpiryDate: readCardData.CardExpiryDate,
            Language: readCardData.Language
        },
        personalData: {
            SurnameCyrl: readPersonalData.SurnameCyrl,
            Surname: readPersonalData.Surname,
            GivenNameCyrl: readPersonalData.GivenNameCyrl,
            GivenName: readPersonalData.GivenName,
            DateOfBirth: readPersonalData.DateOfBirth,
            InsuranceNumber: readPersonalData.InsuranceNumber
        },
        validityData: {ValidUntil: readValidityData.ValidUntil, PermanentlyValid: readValidityData.PermanentlyValid},
        residenceAndInsuranceData: {
            ParentNameCyrl: readResidenceAndInsuranceData.ParentNameCyrl,
            ParentName: readResidenceAndInsuranceData.ParentName,
            Sex: readResidenceAndInsuranceData.Sex,
            PersonalNumber: readResidenceAndInsuranceData.PersonalNumber,
            AddressStreet: readResidenceAndInsuranceData.AddressStreet,
            AddressMunicipality: readResidenceAndInsuranceData.AddressMunicipality,
            AddressTown: readResidenceAndInsuranceData.AddressTown,
            AddressNumber: readResidenceAndInsuranceData.AddressNumber,
            AddressApartmentNumber: readResidenceAndInsuranceData.AddressApartmentNumber,
            InsuranceReason: readResidenceAndInsuranceData.InsuranceReason,
            InsuranceDescription: readResidenceAndInsuranceData.InsuranceDescription,
            InsuranceHolderRelation: readResidenceAndInsuranceData.InsuranceHolderRelation,
            InsuranceHolderIsFamilyMember: readResidenceAndInsuranceData.InsuranceHolderIsFamilyMember,
            InsuranceHolderPersonalNumber: readResidenceAndInsuranceData.InsuranceHolderPersonalNumber,
            InsuranceHolderInsuranceNumber: readResidenceAndInsuranceData.InsuranceHolderInsuranceNumber,
            InsuranceHolderSurnameCyrl: readResidenceAndInsuranceData.InsuranceHolderSurnameCyrl,
            InsuranceHolderSurname: readResidenceAndInsuranceData.InsuranceHolderSurname,
            InsuranceHolderNameCyrl: readResidenceAndInsuranceData.InsuranceHolderNameCyrl,
            InsuranceHolderName: readResidenceAndInsuranceData.InsuranceHolderName,
            InsuranceStartDate: readResidenceAndInsuranceData.InsuranceStartDate,
            AddressState: readResidenceAndInsuranceData.AddressState,
            ObligeeName: readResidenceAndInsuranceData.ObligeeName,
            ObligeePlace: readResidenceAndInsuranceData.ObligeePlace,
            ObligeeIdNumber: readResidenceAndInsuranceData.ObligeeIdNumber,
            ObligeeActivity: readResidenceAndInsuranceData.ObligeeActivity
        }
    }
}

