import {HttpMethod} from "../types/types";
import useNotificationMessage, {NotificationType} from "./notification";
import {Loading} from "quasar";

export async function useFetch<TResponse, TData = null>(
    options: {
        url: string;
        method: HttpMethod;
        data?: TData;
        bearerToken: string
    }
): Promise<TResponse> {
    const {url, method, data, bearerToken} = options;
    try {
        Loading.show();
        const response = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization" : `Bearer ${bearerToken}`
            },
            body: JSON.stringify(data)
        });
        const jsonResponse = await response.json();
        Loading.hide();

        switch (response.status) {
            case 200:
                return jsonResponse as TResponse;
            case 401:
                useNotificationMessage(NotificationType.ERROR, jsonResponse.message)
                break;
            case 422:
                useNotificationMessage(NotificationType.ERROR, jsonResponse.message)
                break;
            default:
                useNotificationMessage(NotificationType.ERROR, 'Došlo je do greške, molimo obratite se IT podršci!')
                break;
        }
    } catch (e) {
        Loading.hide();

    }


}