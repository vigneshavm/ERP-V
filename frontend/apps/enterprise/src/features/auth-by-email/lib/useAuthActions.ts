import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/app/store/store';
import { resetAuthState } from '@/entities/session/model/authSlice';

export const useAuthActions = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { loading: isLoading } = useSelector((state: RootState) => state.auth);

    const reset = () => {
        dispatch(resetAuthState());
    };

    return {
        dispatch,
        isLoading,
        reset,
    };
};
