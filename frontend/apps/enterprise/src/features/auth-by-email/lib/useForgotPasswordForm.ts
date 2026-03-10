import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, ForgotPasswordInput } from '@repo/shared-kernel';
import { requestPasswordReset } from "@/entities/session/model/authSlice";
import { useAuthActions } from './useAuthActions';
import { useEffect } from 'react';

export const useForgotPasswordForm = () => {
    const { dispatch, isLoading, reset } = useAuthActions();

    const form = useForm<ForgotPasswordInput>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            email: '',
        },
    });

    const onSubmit = (data: ForgotPasswordInput) => {
        dispatch(requestPasswordReset(data.email));
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
