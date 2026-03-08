import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';
import {
    addToCart,
    removeFromCart,
    updateCartQty,
    updateCartLength,
    clearCart
} from "../../redux/slices/posSlice";
import { CartItem } from "../../types/sales";
import { RootState } from "../../redux/store";

export const usePOSCart = (activeSessionIndex: number) => {
    const dispatch = useDispatch();
    const { sessions } = useSelector((state: RootState) => state.pos);
    const activeSession = sessions[activeSessionIndex];
    const cart = activeSession?.cart || [];

    const addItem = useCallback((item: CartItem, isReturnMode: boolean = false) => {
        // Apply return logic: If Return Mode is ON, ensure qty is negative.
        // If Return Mode is OFF, ensure qty is positive (standard add).
        const quantity = isReturnMode ? -Math.abs(item.qty) : Math.abs(item.qty);
        dispatch(addToCart({ ...item, qty: quantity }));
    }, [dispatch]);

    const removeItem = useCallback((id: string) => {
        dispatch(removeFromCart(id));
    }, [dispatch]);

    const updateQty = useCallback((id: string, qty: number) => {
        dispatch(updateCartQty({ id, qty }));
    }, [dispatch]);

    const updateLength = useCallback((id: string, length: number) => {
        dispatch(updateCartLength({ id, length }));
    }, [dispatch]);

    const clear = useCallback(() => {
        dispatch(clearCart());
    }, [dispatch]);

    return {
        cart,
        addItem,
        removeItem,
        updateQty,
        updateLength,
        clear
    };
};
