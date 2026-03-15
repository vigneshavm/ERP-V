import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, ResetPasswordInput } from '@repo/shared';

import { useAuthActions } from './useAuthActions';
import { useEffect } from 'react';

export const useResetPasswordForm = (email: string, token: string) => {
    const { dispatch, isLoading, reset } = useAuthActions();

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
    };
};

