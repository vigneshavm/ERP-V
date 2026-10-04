import { AppDispatch } from "../store";
import { setCustomer } from '../slices/posSlice';

export const lookupOrCreateCustomer = (_phone: string, _name?: string) => (dispatch: AppDispatch) => {
    dispatch(setCustomer(null));
};
