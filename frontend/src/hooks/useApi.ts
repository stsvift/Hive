import axios, { AxiosError, AxiosRequestConfig } from 'axios'
import { useState } from 'react'
import { getAuthToken } from '../utils/authUtils'

interface ApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

interface ApiResult<T> extends ApiState<T> {
  execute: () => Promise<T | null>
}

// Хук, который позволяет взаимодействовать с API
export function useApi<T>(
  url: string,
  method: string = 'GET',
  initialData: T | null = null
): ApiResult<T> {
  const [state, setState] = useState<ApiState<T>>({
    data: initialData,
    loading: false,
    error: null,
  })

  // Функция для выполнения запроса к API
  const execute = async (data?: any): Promise<T | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const token = getAuthToken()
      const config: AxiosRequestConfig = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
      }

      let response
      if (method === 'GET') {
        response = await axios.get<T>(url, config)
      } else if (method === 'POST') {
        response = await axios.post<T>(url, data, config)
      } else if (method === 'PUT') {
        response = await axios.put<T>(url, data, config)
      } else if (method === 'DELETE') {
        response = await axios.delete<T>(url, config)
      } else {
        throw new Error(`Неподдерживаемый HTTP метод: ${method}`)
      }

      setState({
        data: response.data,
        loading: false,
        error: null,
      })

      return response.data
    } catch (error) {
      let errorMessage = 'Произошла ошибка при выполнении запроса'

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError

        if (axiosError.response) {
          // Ошибка с ответом от сервера
          if (axiosError.response.status === 401) {
            errorMessage =
              'Необходима авторизация для выполнения этого действия'
          } else if (axiosError.response.status === 403) {
            errorMessage = 'У вас нет прав на выполнение этого действия'
          } else if (axiosError.response.status === 404) {
            errorMessage = 'Запрашиваемый ресурс не найден'
          } else if (axiosError.response.status >= 500) {
            errorMessage = 'Ошибка сервера. Пожалуйста, попробуйте позже'
          } else if (
            axiosError.response.data &&
            typeof axiosError.response.data === 'object'
          ) {
            errorMessage = axiosError.response.data.message || errorMessage
          }
        } else if (axiosError.request) {
          // Не получен ответ
          errorMessage = 'Сервер не отвечает. Проверьте подключение к интернету'
        }
      }

      setState({
        data: null,
        loading: false,
        error: errorMessage,
      })

      return null
    }
  }

  return {
    ...state,
    execute,
  }
}
