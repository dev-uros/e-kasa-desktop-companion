import {createApp} from 'vue'
import {Cookies, Loading, LocalStorage, Notify,
    QAvatar, QBtn, QCard, QCardSection, QChip, QForm, QHeader,
    QInput, QLayout, QPage, QPageContainer, QSpinnerHourglass, QToolbar, QToolbarTitle, QTooltip, Quasar} from 'quasar'

// Import icon libraries
import '@quasar/extras/roboto-font/roboto-font.css'
import '@quasar/extras/material-icons/material-icons.css'

// Import Quasar css
import 'quasar/src/css/index.sass'

// Assumes your root component is App.vue
// and placed in same folder as main.js
import App from './App.vue'

const myApp = createApp(App)

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
myApp.use(Quasar, {
    plugins: {Notify, LocalStorage, Loading, Cookies}, // import Quasar plugins and add here
    //todo: set only used components
    components: {QLayout, QHeader, QToolbar, QToolbarTitle, QAvatar, QPage, QPageContainer, QCard, QCardSection, QForm, QInput, QChip, QBtn, QTooltip},
    config: {
        loading: {
            message: 'Vaš zahtev se izvršava, molimo sačekajte.',
            spinnerSize: 160,
            messageColor: 'white',
            backgroundColor: 'bg-grey-1',
            spinner: QSpinnerHourglass,
            spinnerColor: 'primary',
        },
    }
})

// Assumes you have a <div id="app"></div> in your index.html
myApp.mount('#app')
