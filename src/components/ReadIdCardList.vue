<script setup lang="ts">
import {CardData} from "../types/types";
import {getCurrentDate} from "../utils/getCurrentDate";

interface Props {
  cardData: CardData
}
defineProps<Props>()
</script>

<template>
  <div class="row">

    <div class="col-6">
      <q-toolbar>
        <q-toolbar-title>
          Podaci o građaninu
        </q-toolbar-title>
      </q-toolbar>
      <q-list  separator dense>
        <q-item>
          <q-item-section>
            <q-item-label>{{ cardData.personalData.Surname }}</q-item-label>
            <q-item-label caption>Prezime</q-item-label>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-item-label>{{ cardData.personalData.GivenName }}</q-item-label>
            <q-item-label caption>Ime</q-item-label>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-item-label>{{ cardData.personalData.ParentGivenName}}</q-item-label>
            <q-item-label caption>Ime roditelja</q-item-label>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-item-label>{{ cardData.personalData.PlaceOfBirth}}, {{ cardData.personalData.CommunityOfBirth}}, {{ cardData.personalData.StateOfBirth}}</q-item-label>
            <q-item-label caption>Mesto rođenja, opština i država</q-item-label>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-item-label>{{ cardData.residenceData.Place }}, {{ cardData.residenceData.Community}}, {{cardData.residenceData.Street }}, {{cardData.residenceData.AddressNumber }}{{ cardData.residenceData.AddressLetter}}/{{cardData.residenceData.AddressFloor}}/{{cardData.residenceData.AddressApartmentNumber}}</q-item-label>
            <q-item-label caption>Prebivalište i adresa stana</q-item-label>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-item-label>{{ cardData.residenceData.AddressDate}}</q-item-label>
            <q-item-label caption>Datum promene adrese</q-item-label>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-item-label>{{ cardData.personalData.PersonalNumber }}</q-item-label>
            <q-item-label caption>JMBG</q-item-label>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-item-label>{{ cardData.personalData.Sex }}</q-item-label>
            <q-item-label caption>Pol</q-item-label>
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
          Podaci o dokumentu
        </q-toolbar-title>
      </q-toolbar>
      <q-list  separator dense>
        <q-item>
          <q-item-section>
            <q-item-label>{{ cardData.documentData.IssuingAuthority}}</q-item-label>
            <q-item-label caption>Dokument izdaje</q-item-label>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-item-label>{{ cardData.documentData.DocumentNumber}}</q-item-label>
            <q-item-label caption>Broj dokumenta</q-item-label>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-item-label>{{ cardData.documentData.IssuingDate}}</q-item-label>
            <q-item-label caption>Datum izdavanja</q-item-label>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-item-label>{{ cardData.documentData.ExpiryDate}}</q-item-label>
            <q-item-label caption>Važi do</q-item-label>
          </q-item-section>
        </q-item>
<!--        <q-item>-->
<!--          <q-img :src="`data:image/jpeg;base64, ${cardData.image}`" style="max-width: 200px; max-height: 240px; margin: 0 auto"></q-img>-->
<!--        </q-item>-->
      </q-list>
    </div>

  </div>

</template>

<style scoped>

</style>