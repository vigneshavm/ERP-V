import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AppDispatch, RootState } from "@/app/store/store";
import { resetAuthState } from "@/entities/session/model/authSlice";

export const useAuthActions = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const authState = useSelector((state: RootState) => state.auth);
    const { user, isSuccess } = authState;

    useEffect(() => {
        if (isSuccess || user) {
            navigate('/dashboard');
        }

        // Explicitly NOT resetting on every render, 
        // but providing a reset function for the components to use on unmount
    }, [user, isSuccess, navigate]);

    const reset = () => dispatch(resetAuthState());

    return {
        ...authState,
        dispatch,
        navigate,
        reset
    };
};
