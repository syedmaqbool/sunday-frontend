import type { ApiResponseItem } from './api.type';
import type { GetMyNotificationsData, GetMyNotificationsResponses } from '@/types/generated-api';

export type Notification = ApiResponseItem<GetMyNotificationsResponses>;
export type NotificationReadStatus = NonNullable<GetMyNotificationsData['query']['status']>;
