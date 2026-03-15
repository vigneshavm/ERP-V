import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginInput } from '@repo/shared';

import { useAuthActions } from './useAuthActions';
import { login } from '@/entities/session/model/authSlice';
import { useEffect } from 'react';

export const useLoginForm = () => {
    const { dispatch, isLoading, reset } = useAuthActions();

    const form = useForm<LoginInput>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
            rememberMe: false,
        },
    });

    const onSubmit = (data: LoginInput) => {
        dispatch(login(data));
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

