import { createContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth, useUser } from "@clerk/clerk-react";

export const AppContext = createContext();

export const AppContextProvider = (props) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    const { user } = useUser();
    const { getToken } = useAuth();

    const [searchFilter, setSearchFilter] = useState({
        title: '',
        location: ''
    });

    const [isSearched, setIsSearched] = useState(false);
    const [jobs, setJobs] = useState([]);
    const [showRecruiterLogin, setShowRecruiterLogin] = useState(false);
    const [companyToken, setCompanyToken] = useState(null);
    const [companyData, setCompanyData] = useState(null);
    const [userData, setUserData] = useState(null);
    const [userApplications, setUserApplications] = useState([]);

    // ✅ Utility: Validate base64 string (used in JWT)
    function isValidBase64(str) {
        try {
            if (!str || typeof str !== 'string') return false;
            atob(str);
            return true;
        } catch (e) {
            return false;
        }
    }

    // ✅ Optional: Parse JWT (you can use this if needed)
    function parseJWT(token) {
        try {
            const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
            const json = atob(base64);
            return JSON.parse(json);
        } catch (e) {
            console.warn("Invalid token payload:", e.message);
            return null;
        }
    }

    // 🔹 Fetch Jobs 
    const fetchJobs = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/jobs');
            if (data.success) setJobs(data.jobs);
            else toast.error(data.message);
        } catch (error) {
            toast.error(error.message);
        }
    };

    // 🔹 Fetch Company Data
    const fetchCompanyData = async () => {
        try {
            const { data } = await axios.get(
                backendUrl + '/api/company/company',
                { headers: { token: companyToken } }
            );
            if (data.success) setCompanyData(data.company);
            else toast.error(data.message);
        } catch (error) {
            toast.error(error.message);
        }
    };

    // 🔹 Fetch User Data
    const fetchUserData = async () => {
        try {
            const token = await getToken();
            const { data } = await axios.get(
                backendUrl + '/api/users/user',
                { headers: { Authorization: Bearer ${token} } }
            );
            if (data.success) setUserData(data.user);
            else toast.error(data.message);
        } catch (error) {
            toast.error(error.message);
        }
    };

    // 🔹 Fetch User's Applications
    const fetchUserApplications = async () => {
        try {
            const token = await getToken();
            const { data } = await axios.get(
                backendUrl + '/api/users/applications',
                { headers: { Authorization: Bearer ${token} } }
            );
            if (data.success) setUserApplications(data.applications);
            else toast.error(data.message);
        } catch (error) {
            toast.error(error.message);
        }
    };

    // 🔹 On load: Fetch Jobs + Retrieve companyToken
    useEffect(() => {
        fetchJobs();

        const storedCompanyToken = localStorage.getItem('companyToken');
        if (
            storedCompanyToken &&
            storedCompanyToken.includes('.') &&
            isValidBase64(storedCompanyToken.split('.')[1])
        ) {
            setCompanyToken(storedCompanyToken);
        } else {
            console.warn("Invalid or corrupt companyToken in localStorage");
            localStorage.removeItem('companyToken');
        }
    }, []);

    // 🔹 If companyToken is valid, fetch company data
    useEffect(() => {
        if (companyToken) {
            fetchCompanyData();
        }
    }, [companyToken]);

    // 🔹 If user is logged in, fetch user data
    useEffect(() => {
        if (user) {
            fetchUserData();
            fetchUserApplications();
        }
    }, [user]);

    const value = {
        setSearchFilter, searchFilter,
        isSearched, setIsSearched,
        jobs, setJobs,
        showRecruiterLogin, setShowRecruiterLogin,
        companyToken, setCompanyToken,
        companyData, setCompanyData,
        backendUrl,
        userData, setUserData,
        userApplications, setUserApplications,
        fetchUserData,
        fetchUserApplications,
    };

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    );
};