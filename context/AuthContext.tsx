"use client"
import { createContext, useContext, useState,useEffect,useReducer } from 'react'
import { jwtDecode } from 'jwt-decode'
import {MainPageLoader} from "../components/loader/MainPageLoader";
import {CartServices} from "@/services/cartServices";

interface DecodedToken {
    user_id: string
    email: string
    roles: string[]
    token_type: string
    exp: number
    iat: number
    jti: string
    first_name:string,
    last_name:string
}

interface UserProfile {
    id: string
    email: string
    first_name: string
    last_name: string
    roles: string[]
}

interface AuthContextType {
    user: UserProfile | null
    showMainPageLoader: boolean  
    tmpId: string | null  
    // cartItemsCount :   number              
    setShowMainPageLoader: (value: boolean) => void 
    login: (accessToken: string) => void
    logout: () => void
    hasRole: (role: string) => boolean
    isCustomer: () => boolean
    isSuperAdmin: () => boolean
    isLaboratory: () => boolean
    reducerState: reducerState
    dispatch: React.Dispatch<ReducerAction>
    fetchCartCount: (tmpId:string | null) => Promise<void>
}


type ReducerAction = | { type: 'SET_COUNT'; payload: number } | { type: 'CART_MODAL'; payload: boolean }

interface reducerState {
    cartItemsCount: number
    cartModalOpenFlag : boolean
}



const Reducerfunc = (state: reducerState, action: ReducerAction): reducerState => {
    switch (action.type) {
        case 'SET_COUNT':
            return { ...state, cartItemsCount: action.payload }
        case 'CART_MODAL':
            return {...state, cartModalOpenFlag : action.payload}
        default:
            return state
    }
}


const initialState: reducerState = {
    cartItemsCount: 0,
    cartModalOpenFlag : false
}


const AuthContext = createContext<AuthContextType | null>(null)


function getLocalStorage(key: string): string | null {
    if (typeof window === 'undefined') return null  
    return localStorage.getItem(key)
}

function removeLocalStorage(key: string): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(key)
}

function buildUserProfile(accessToken: string): UserProfile | null {
    try {
        const decoded = jwtDecode<DecodedToken>(accessToken)

        const isExpired = Date.now() > decoded.exp * 1000
        if (isExpired) {
            localStorage.removeItem('access_token')
            document.cookie = 'access_token=; max-age=0; path=/'
            return null
        }else{
            document.cookie = `access_token=${accessToken}; path=/; max-age= ${decoded.exp}`
        }

        return {
            id: decoded.user_id,
            email: decoded.email,
            roles: decoded.roles,
            first_name: decoded.first_name,
            last_name: decoded.last_name,
        }
    } catch {
        return null
    }
}


function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null; // SSR guard
  return (
    document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${name}=`))
      ?.split("=")[1] || null
  );
}

function setTmpIdCookie(): string {
  let tmpId = getCookie("tmp_id");
  if (!tmpId) {
    tmpId = crypto.randomUUID();
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `tmp_id=${tmpId}; expires=${expires}; path=/; SameSite=Lax`;
  }
  return tmpId;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {

    const [user, setUser] = useState<UserProfile | null>(null)
    const [isLoading, setIsLoading] = useState(true)  
    const [showMainPageLoader, setShowMainPageLoader] = useState(false) // 
    const [tmpId, setTmpId] = useState<string | null>(null);
    // const [cartItemsCount, setCartItemsCount] = useState(0);

    const [reducerState, dispatch] = useReducer(Reducerfunc, initialState)

    useEffect(() => {
        // Runs only on client — sets tmp_id cookie if not already present
        const id = setTmpIdCookie();
        setTmpId(id);
    }, []);


    const fetchCartCount = async (tmpId: string | null): Promise<void> => {
        try {
            const response = await CartServices.cartItemsCount(tmpId)
            dispatch({ type: 'SET_COUNT', payload: response.result.count })
        } catch (error) {
            dispatch({ type: 'SET_COUNT', payload: 0 })
            if (process.env.NODE_ENV !== "production") {
                const message =
                    typeof error === "object" && error !== null && "message" in error
                        ? String((error as { message?: unknown }).message ?? "Unknown error")
                        : "Unknown error";
                console.warn(`Failed to fetch cart count: ${message}`)
            }
        }
    }

    useEffect(() => {
        if(tmpId){
            fetchCartCount(tmpId)
        }
    }, [tmpId])



    useEffect(() => {
        const token = getLocalStorage('access_token')
        if (token) {
            const profile = buildUserProfile(token)
            setUser(profile)
        }
        setIsLoading(false)  
    }, []) 

    function login(accessToken: string) {
        localStorage.setItem('access_token', accessToken)
        const profile = buildUserProfile(accessToken)
        setUser(profile)
        if (profile) {
            localStorage.setItem('user_profile', JSON.stringify(profile));
        }
    }

    function logout() {
        removeLocalStorage('access_token')        
        localStorage.removeItem('user_profile');
        document.cookie = 'access_token=; max-age=0; path=/'
        setUser(null)
        window.location.href = '/my-account'
    }

    function hasRole(role: string): boolean {
        return user?.roles?.includes(role) ?? false
    }

    function isCustomer(): boolean {
        return hasRole('customer')
    }

    function isSuperAdmin(): boolean {
        return hasRole('superadmin')
    }

    function isLaboratory(): boolean {
        return hasRole('laboratory')
    }












    return (
        <AuthContext.Provider value={{
            user,
            showMainPageLoader,
            tmpId,
            setShowMainPageLoader,
            login,
            logout,
            hasRole,
            isCustomer,
            isSuperAdmin,
            isLaboratory,
            // cartItemsCount,
            reducerState, 
            dispatch,
            fetchCartCount,
        }}>
            {showMainPageLoader && <MainPageLoader />}
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext)
    if (!context) throw new Error('useAuth must be used within AuthProvider')
    return context
}
