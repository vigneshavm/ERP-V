import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';
import {
    setActiveSession,
    addSession,
    removeSession,
    holdCurrentBill,
    resumeBill,
    discardHeldBill
} from "@/entities/sales/model/posSlice";
import { RootState } from "@/app/store/store";

export const usePOSSession = () => {
    const dispatch = useDispatch();
    const { sessions, activeSessionIndex, heldBills } = useSelector((state: RootState) => state.pos);

    const switchSession = useCallback((idx: number) => {
        dispatch(setActiveSession(idx));
    }, [dispatch]);

    const addNewSession = useCallback(() => {
        dispatch(addSession());
    }, [dispatch]);

    const removeSessionByIdx = useCallback((idx: number) => {
        dispatch(removeSession(idx));
    }, [dispatch]);

    const holdBill = useCallback((note?: string) => {
        dispatch(holdCurrentBill({ note }));
    }, [dispatch]);

    const resumeHeldBill = useCallback((id: string) => {
        dispatch(resumeBill(id));
    }, [dispatch]);

    const discardBill = useCallback((id: string) => {
        dispatch(discardHeldBill(id));
    }, [dispatch]);

    return {
        sessions,
        activeSessionIndex,
        heldBills,
        activeSession: sessions[activeSessionIndex],
        switchSession,
        addNewSession,
        removeSessionByIdx,
        holdBill,
        resumeHeldBill,
        discardBill
    };
};
