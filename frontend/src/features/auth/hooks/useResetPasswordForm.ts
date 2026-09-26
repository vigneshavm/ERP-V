import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, ResetPasswordInput } from '../../../validations/auth.schema';
import { performPasswordReset } from '../../../redux/slices/authSlice';
import { useAuthActions } from './useAuthActions';
import { useEffect } from 'react';

export const useResetPasswordForm = (email: string, token: string) => {
    const { dispatch, isLoading, isError, isSuccess, message, deviceConflict, reset } = useAuthActions();

    const form = useForm<ResetPasswordInput>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            password: '',
            confirmPassword: '',
        },
    });

    const onSubmit = (data: ResetPasswordInput) => {
        dispatch(performPasswordReset({ token, email, password: data.password }));
    };

    useEffect(() => {
        return () => {
            reset();
        };
    }, []);

    return {
        form,
        onSubmit: form.handleSubmit(onSubmit),
        isLoading,
        // Outcome of the auth request, for the page's error/success alerts.
        isError,
        isSuccess,
        message,
        deviceConflict,
        reset,
    };
};
