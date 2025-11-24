import { reactive } from 'vue'
import RestClient from '@/utils/restClient'


export default function createGirderClient(options = {}) {
    const restClient = new RestClient(options)

    const state = reactive({
        user: restClient.user,
        token: restClient.token,
    })

    restClient.on('login', user => {
        state.user = user
        state.token = restClient.token
    })

    restClient.on('logout', () => {
        state.user = null
        state.token = null
    })

    restClient.on('register', user => {
        state.user = user
        state.token = restClient.token
    })
    return { rest: restClient, state }
}
