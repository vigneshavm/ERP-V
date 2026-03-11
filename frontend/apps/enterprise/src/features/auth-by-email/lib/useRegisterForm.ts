import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterInput } from '@repo/shared';
import { register } from "@/entities/session/model/authSlice";
import { useAuthActions } from './useAuthActions';
import { useEffect } from 'react';

export const useRegisterForm = () => {
    const { dispatch, isLoading, reset } = useAuthActions();

    const form = useForm<RegisterInput>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: '',
            email: '',
            shopName: '',
            phone: '',
            password: '',
            confirmPassword: '',
            terms: false,
        },
    });

    const onSubmit = (data: RegisterInput) => {

        const { confirmPassword, terms, ...userData } = data;
        dispatch(register(userData));
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

