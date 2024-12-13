<script setup lang="ts">
import {MedCardData} from "../types/types";
import {getCurrentDate} from "../utils/getCurrentDate";

interface Props {
  cardData: MedCardData
}

defineProps<Props>()
</script>

<template>
  <div class="row">

    <div class="col-6">
      <q-toolbar>
        <q-toolbar-title>
          Opšti podaci o osiguraniku
        </q-toolbar-title>
      </q-toolbar>
      <q-list separator dense>
        <q-item>
          <q-item-section>
            <q-item-label>{{ cardData.personalData.GivenNameCyrl }} ({{ cardData.personalData.GivenName }})
            </q-item-label>
            <q-item-label caption>Ime</q-item-label>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-item-label>{{ cardData.residenceAndInsuranceData.ParentNameCyrl }}
              ({{ cardData.residenceAndInsuranceData.ParentName }})
            </q-item-label>
            <q-item-label caption>Ime roditelja</q-item-label>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-item-label>{{ cardData.personalData.SurnameCyrl }} ({{ cardData.personalData.Surname}})</q-item-label>
            <q-item-label caption>Prezime</q-item-label>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-item-label>{{ cardData.personalData.DateOfBirth}}</q-item-label>
            <q-item-label caption>Datum rođenja</q-item-label>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-item-label>{{ cardData.residenceAndInsuranceData.AddressTown}}, {{ cardData.residenceAndInsuranceData.AddressMunicipality}}, {{ cardData.residenceAndInsuranceData.AddressState}}</q-item-label>
            <q-item-label caption>Mesto, opština i država</q-item-label>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-item-label>{{ cardData.residenceAndInsuranceData.AddressStreet }} {{ cardData.residenceAndInsuranceData.AddressNumber}}</q-item-label>
            <q-item-label caption>Ulica i broj</q-item-label>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-item-label>{{ cardData.residenceAndInsuranceData.Sex }}</q-item-label>
            <q-item-label caption>Pol</q-item-label>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-item-label>{{ cardData.cardData.Language }}</q-item-label>
            <q-item-label caption>Jezik</q-item-label>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-item-label>{{ cardData.personalData.InsuranceNumber }}</q-item-label>
            <q-item-label caption>LBO</q-item-label>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-item-label>{{ cardData.residenceAndInsuranceData.PersonalNumber }}</q-item-label>
            <q-item-label caption>JMBG</q-item-label>
          </q-item-section>
        </q-item>

      </q-list>
      <q-toolbar>
        <q-toolbar-title>
          Podaci o kartici zdravstvenog osiguranja
        </q-toolbar-title>
      </q-toolbar>
      <q-list separator dense>
        <q-item>
          <q-item-section>
            <q-item-label>{{ cardData.cardData.CardIssueDate }}</q-item-label>
            <q-item-label caption>Datum izdavanja</q-item-label>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-item-label>{{ cardData.cardData.CardExpiryDate }}</q-item-label>
            <q-item-label caption>Datum važenja</q-item-label>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-item-label>{{ cardData.validityData.ValidUntil }}</q-item-label>
            <q-item-label caption>Overena do</q-item-label>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-item-label>{{ cardData.validityData.PermanentlyValid ? 'Да': 'Не' }}</q-item-label>
            <q-item-label caption>Trajno overena</q-item-label>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section class="text-bold">Datum očitavanja</q-item-section>
          <q-item-section avatar class="text-bold">
            {{ getCurrentDate() }}
          </q-item-section>
        </q-item>

      </q-list>
    </div>
    <div class="col-6">
      <q-toolbar>
        <q-toolbar-title>
          Podaci o nosiocu osiguranja
        </q-toolbar-title>
      </q-toolbar>
      <q-list separator dense>
        <q-item>
          <q-item-section>
            <q-item-label>{{ cardData.residenceAndInsuranceData.InsuranceHolderNameCyrl }} ({{ cardData.residenceAndInsuranceData.InsuranceHolderName}})</q-item-label>
            <q-item-label caption>Ime</q-item-label>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-item-label>{{ cardData.residenceAndInsuranceData.InsuranceHolderSurnameCyrl }} ({{ cardData.residenceAndInsuranceData.InsuranceHolderSurname }})</q-item-label>
            <q-item-label caption>Prezime</q-item-label>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-item-label>{{ cardData.residenceAndInsuranceData.InsuranceHolderInsuranceNumber }}</q-item-label>
            <q-item-label caption>LBO</q-item-label>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-item-label>{{ cardData.residenceAndInsuranceData.InsuranceHolderPersonalNumber }}</q-item-label>
            <q-item-label caption>JMBG</q-item-label>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-item-label>{{ cardData.residenceAndInsuranceData.InsuranceHolderIsFamilyMember ? 'Да' : 'Не'  }}</q-item-label>
            <q-item-label caption>Član porodice</q-item-label>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-item-label>{{ cardData.residenceAndInsuranceData.InsuranceHolderRelation }}</q-item-label>
            <q-item-label caption>Srodstvo</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
      <q-toolbar>
        <q-toolbar-title>
          Podaci o osiguranju
        </q-toolbar-title>
      </q-toolbar>
      <q-list separator dense>
        <q-item>
          <q-item-section>
            <q-item-label>{{ cardData.residenceAndInsuranceData.InsuranceReason}}</q-item-label>
            <q-item-label caption>Osnov osiguranja</q-item-label>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-item-label>{{ cardData.residenceAndInsuranceData.InsuranceStartDate}}</q-item-label>
            <q-item-label caption>Datum početka osiguranja</q-item-label>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-item-label>{{ cardData.residenceAndInsuranceData.InsuranceDescription}}</q-item-label>
            <q-item-label caption>Opis</q-item-label>
          </q-item-section>
        </q-item>

      </q-list>
      <q-toolbar>
        <q-toolbar-title>
          Podaci o obvezniku plaćanja doprinosa
        </q-toolbar-title>
      </q-toolbar>
      <q-list separator dense>
        <q-item>
          <q-item-section>
            <q-item-label>{{ cardData.residenceAndInsuranceData.ObligeeName}}</q-item-label>
            <q-item-label caption>Naziv</q-item-label>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-item-label>{{ cardData.residenceAndInsuranceData.ObligeePlace}}</q-item-label>
            <q-item-label caption>Sedište</q-item-label>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-item-label>0</q-item-label>
            <q-item-label caption>Registarski broj</q-item-label>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-item-label>{{ cardData.residenceAndInsuranceData.ObligeeIdNumber}}</q-item-label>
            <q-item-label caption>PIB/JMBG</q-item-label>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-item-label>{{ cardData.residenceAndInsuranceData.ObligeeActivity}}</q-item-label>
            <q-item-label caption>Delatnost</q-item-label>
          </q-item-section>
        </q-item>

      </q-list>
    </div>

  </div>

</template>

<style scoped>

</style>