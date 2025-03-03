export enum HttpMethod {
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    PATCH = 'PATCH',
    DELETE = 'DELETE'
}

export type ActivateApplicationDataRequest = {
    activation_key: string,

}
export type ActivateApplicationDataResponse = {
    message: string,
    data: {
        plainTextActivationKey: string
    }
}


export enum ConnectionTypes {
    DESKTOP = 'DESKTOP'
}

export enum MessageTypes {
    PONG = 'PONG',
    PING = 'PING',
    CONNECTION_OPEN = 'CONNECTION_OPEN',
    INSERT_READER_INTO_DEVICE = 'INSERT_READER_INTO_DEVICE',
    INSERT_CARD_INTO_READER = 'INSERT_CARD_INTO_READER',
    ERROR = 'ERROR',
    CARD_DATA_READ = 'CARD_DATA_READ',
    CARD_IS_BEING_READ = 'CARD_IS_BEING_READ',
    CONNECTION_CLOSE = 'CONNECTION_CLOSE',
    DOCUMENT_SCANNED = 'DOCUMENT_SCANNED',
    INSERT_DOCUMENT_IN_SCANNER = 'INSERT_DOCUMENT_IN_SCANNER',
    POS_TRANSACTION_FINISHED = 'POS_TRANSACTION_FINISHED'


}

export type PosPaymentMessage = {
    transactionId: string,
    amount: string,
    installmentsCount: string,
}

export type PosTransactionFinishedMessage = {
    statusCode: string,
    statusCodeDisplay: string,
    response:string,
    request: string
}
export enum ReadCardCommand {
    READ_ID_CARD = 'READ_ID_CARD',
    READ_MED_CARD = 'READ_MED_CARD',
    CANCEL_CARD_READ = 'CANCEL_CARD_READ',
    SCAN_DOCUMENT = 'SCAN_DOCUMENT',
    CANCEL_SCAN_DOCUMENT = 'CANCEL_SCAN_DOCUMENT',
    MAKE_POS_PAYMENT = 'MAKE_POS_PAYMENT',

}
export enum CardType {
    MED_CARD = 'MED_CARD',
    ID_CARD = 'ID_CARD'
}
export type IDDocumentData = {
    DocumentNumber: string,
    DocumentType: string,
    DocumentSerialNumber: string,
    IssuingDate: string,
    ExpiryDate: string,
    IssuingAuthority: string
}

export type IDPersonalData = {
    PersonalNumber: string,
    Surname: string,
    GivenName: string,
    ParentGivenName: string,
    Sex: string,
    PlaceOfBirth: string,
    CommunityOfBirth: string,
    StateOfBirth: string,
    DateOfBirth: string
}
export type IDResidenceData = {
    State: string,
    Community: string,
    Place: string,
    Street: string,
    AddressNumber: string,
    AddressLetter: string,
    AddressEntrance: string,
    AddressFloor: string,
    AddressApartmentNumber: string,
    AddressDate: string
}
export type CardData = {
    cardType: CardType
    documentData: IDDocumentData,
    personalData: IDPersonalData,
    residenceData: IDResidenceData
}

export type MedCardDocumentData = {
    InsurerName: string,
    InsurerID: string,
    CardId: string,
    CardIssueDate: string,
    CardExpiryDate: string,
    Language: string
}

export type MedCardPersonalData = {
    SurnameCyrl: string,
    Surname: string,
    GivenNameCyrl: string,
    GivenName: string,
    DateOfBirth: string,
    InsuranceNumber: string
}
export type MedCardValidityData = {
    ValidUntil: string,
    PermanentlyValid: string
}

export type MedCardResidenceAndInsuranceData = {
    ParentNameCyrl: string,
    ParentName: string,
    Sex: string,
    PersonalNumber: string,
    AddressStreet: string,
    AddressMunicipality: string,
    AddressTown: string,
    AddressNumber: string,
    AddressApartmentNumber: string,
    InsuranceReason: string,
    InsuranceDescription: string,
    InsuranceHolderRelation: string,
    InsuranceHolderIsFamilyMember: string,
    InsuranceHolderPersonalNumber: string,
    InsuranceHolderInsuranceNumber: string,
    InsuranceHolderSurnameCyrl: string,
    InsuranceHolderSurname: string,
    InsuranceHolderNameCyrl: string,
    InsuranceHolderName: string,
    InsuranceStartDate: string,
    AddressState: string,
    ObligeeName: string,
    ObligeePlace: string,
    ObligeeIdNumber: string,
    ObligeeActivity: string
}
export type MedCardData = {
    cardType: CardType
    cardData: MedCardDocumentData
    personalData: MedCardPersonalData,
    validityData: MedCardValidityData
    residenceAndInsuranceData: MedCardResidenceAndInsuranceData
}

