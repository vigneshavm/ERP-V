
export const registrationUtil = {
    registerTenant: (data: any) => {
        console.log("Mock registration:", data);
        return Promise.resolve({ success: true });
    },
    loadDynamicData: () => {
        return {};
    }
};
