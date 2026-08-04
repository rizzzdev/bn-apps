export interface RoomGetByIdQuery {}

export interface RoomGetAllQuery extends RoomGetByIdQuery {
  name?: string;
  page?: number;
  limit?: number;
}
