"use client";

import "./my-account.css";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation'
import {stateService} from '../../services/stateService';
import {loginServices} from '../../services/loginServices';
import axios from "axios";
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { State, RegisterState ,LoginState } from '@/types';


const parseErrorMessage = (payload: unknown, fallback: string) => {
  if (!payload || typeof payload !== "object") return fallback;
  const obj = payload as {
    msg?: string;
    error?: string;
    message?: string;
    errors?: Record<string, unknown> | string;
  };

  if (obj.msg) return obj.msg;
  if (obj.error) return obj.error;
  if (obj.message) return obj.message;
  if (obj.errors) {
    if (typeof obj.errors === "string") return obj.errors;
    if (typeof obj.errors === "object") {
      const firstKey = Object.keys(obj.errors)[0];
      const firstValue = obj.errors[firstKey];
      if (Array.isArray(firstValue)) return String(firstValue[0]);
      if (typeof firstValue === "string") return firstValue;
    }
  }
  return fallback;
};

const getRequestErrorDetails = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    return {
      status: error.response?.status,
      payload: error.response?.data,
      message: error.message || "",
    };
  }

  if (error && typeof error === "object") {
    const normalized = error as { status?: number; payload?: unknown; message?: string };
    return {
      status: normalized.status,
      payload: normalized.payload,
      message: normalized.message || "",
    };
  }

  return { status: undefined, payload: undefined, message: "" };
};

const isDuplicateEmailError = (message: string) => {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("email") &&
    (normalized.includes("already exists") ||
      normalized.includes("already exist") ||
      normalized.includes("unique"))
  );
};

const getErrorText = (value: unknown): string | null => {
  if (Array.isArray(value)) {
    return value.length ? String(value[0]) : null;
  }
  if (typeof value === "string") {
    return value;
  }
  return null;
};

const getRegisterEmailErrorFromPayload = (payload: unknown): string | null => {
  if (!payload || typeof payload !== "object") return null;

  const parsedPayload = payload as {
    email?: unknown;
    errors?: Record<string, unknown>;
  };

  const directEmailError = getErrorText(parsedPayload.email);
  if (directEmailError) return directEmailError;

  if (parsedPayload.errors && typeof parsedPayload.errors === "object") {
    const nestedEmailError = getErrorText(parsedPayload.errors.email);
    if (nestedEmailError) return nestedEmailError;
  }

  return null;
};

const getFriendlyRegisterError = (error: unknown): { toastMessage: string; emailError: string } => {
  const { status, payload, message } = getRequestErrorDetails(error);
  const parsedMessage = parseErrorMessage(payload, message || "Registration failed!");
  const payloadEmailError = getRegisterEmailErrorFromPayload(payload);

  if (payloadEmailError && isDuplicateEmailError(payloadEmailError)) {
    return {
      toastMessage: "",
      emailError: "The email you entered is already registered.",
    };
  }

  if (isDuplicateEmailError(parsedMessage)) {
    return {
      toastMessage: "",
      emailError: "The email you entered is already registered.",
    };
  }

  if (payloadEmailError) {
    return {
      toastMessage: "",
      emailError: payloadEmailError,
    };
  }

  if (status === 400) {
    return {
      toastMessage: parsedMessage || "Invalid data!",
      emailError: "",
    };
  }

  return {
    toastMessage: parsedMessage || "Registration failed!",
    emailError: "",
  };
};

const getFriendlyLoginError = (error: unknown) => {
  const { status, payload, message } = getRequestErrorDetails(error);
  const parsedMessage = parseErrorMessage(payload, message || "Login failed!");

  if (status === 400) {
    return parsedMessage || "Invalid data!";
  }

  return parsedMessage || "Login failed!";
};

const isValidEmailFormat = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const DEFAULT_REGISTER: RegisterState = {
  email: "",
  user_type: "Laboratory(manually reviewed)",
  first_name: "",
  last_name: "",
  Company_name: "",
  Street_Address: "",
  Address_Line_2: "",
  state: null,
  Town_City: "",
  Zip_Code: "",
  phone_number: "",
};

export default function LoginForm() {

  const router = useRouter()
  const {setShowMainPageLoader,login:userLogin} = useAuth()

  const { setToastNotification } = useToast()
  const [login, setLogin] = useState<LoginState>({
    email: "",
    password: "",
    remember: false,
  });
  const [register, setRegister] = useState<RegisterState>(DEFAULT_REGISTER);
  const [registerEmailError, setRegisterEmailError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [state, setStates] = useState<State[]>([]);
  const [isCheckingRegisterEmail, setIsCheckingRegisterEmail] = useState(false);


    useEffect(() => {
      const fetchStates = async () => {
        setShowMainPageLoader(true)
          try {
              const response = await stateService.getAllStates()
              setStates(response?.result?.data)
              setShowMainPageLoader(false)
          } catch (error) {
              setToastNotification({
                  type: 'error',
                  message: 'Failed to load states!'
              })
              setShowMainPageLoader(false)
          }
        }
        fetchStates()
    }, [])

  useEffect(() => {
    const email = register.email.trim().toLowerCase();
    if (!email || !isValidEmailFormat(email)) {
      setIsCheckingRegisterEmail(false);
      return;
    }

    let isCancelled = false;
    const timeoutId = setTimeout(async () => {
      setIsCheckingRegisterEmail(true);
      try {
        const response = await loginServices.checkEmailAvailability(email);
        if (isCancelled) return;
        setRegisterEmailError(response?.exists ? "The email you entered is already registered." : "");
      } catch {
        if (!isCancelled) {
          setRegisterEmailError("");
        }
      } finally {
        if (!isCancelled) {
          setIsCheckingRegisterEmail(false);
        }
      }
    }, 350);

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [register.email]);


  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setShowMainPageLoader(true)
    setLoginLoading(true)
    try {
        const response = await loginServices.UserSignIn({email: login.email,password: login.password})
        console.log("response",response)
        if(response?.status === "success"){
          userLogin(response?.access_token)
          setShowMainPageLoader(false)
          setToastNotification({type: 'success',message: 'Account created! Please check your email ✉️'})
          router.replace('/my-account/dashboard')
        }
    } catch (error: unknown) {
          setShowMainPageLoader(false)
          setToastNotification({
              type: 'error',
              message: getFriendlyLoginError(error)
          })
    } finally {
          setLoginLoading(false)
          setShowMainPageLoader(false)
    }
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    if (registerEmailError) {
      return;
    }

    setShowMainPageLoader(true)
    setRegisterLoading(true)
    try {
        const response = await loginServices.UserSignUp({...register,state: Number(register.state)})
        console.log("response",response)
        if(response?.status === "success"){
          setShowMainPageLoader(false)
          setRegister(DEFAULT_REGISTER)
          setRegisterEmailError("")
          setToastNotification({type: 'success',message: response.msg})

        }
    } catch (error: unknown) {
          setShowMainPageLoader(false)
          const friendlyError = getFriendlyRegisterError(error)
          setRegisterEmailError(friendlyError.emailError)

          if (friendlyError.toastMessage) {
            setToastNotification({
                type: 'error',
                message: friendlyError.toastMessage
            })
          }
    } finally {
          setRegisterLoading(false)
          setShowMainPageLoader(false)
    }
  };

  return (
    <section className="my-account-page">
      <div className="account-container">

        {/* Page Title */}
        <h1 className="account-title">My Account</h1>

        <div className="account-grid">

          {/* ================= LOGIN ================= */}
          <form className="account-card" onSubmit={handleLogin}>

            <h3 className="account-section-title">LOGIN</h3>


            {/* Username */}
            <div className="form-group">
              <label>USERNAME OR EMAIL ADDRESS <span className="required_fields"> * </span></label>
              <input
                type="email"
                value={login.email}
                onChange={(event) =>
                  setLogin((prev) => ({ ...prev, email: event.target.value }))
                }
                required
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label>PASSWORD <span className="required_fields"> * </span> </label>
              <input
                type="password"
                value={login.password}
                onChange={(event) =>
                  setLogin((prev) => ({ ...prev, password: event.target.value }))
                }
                required
              />
            </div>

            {/* Remember */}
            <div className="remember-row">
              <input
                type="checkbox"
                checked={login.remember}
                onChange={(event) =>
                  setLogin((prev) => ({ ...prev, remember: event.target.checked }))
                }
              />
              <span>Remember me</span>
            </div>

            {/* {loginError && <p className="text-red-600 text-sm">{loginError}</p>} */}

            <button className="primary-btn lost-btn" type="submit" disabled={loginLoading}>
              {loginLoading ? "LOGGING IN..." : "LOG IN"}
            </button>

            <div className="forgot-link mt-3">
              <Link
                href="/my-account/lost-password/"
                className="forgot-link mt-3 inline-block"
                style={{ color: "#0C86D1", fontSize: "medium" }}
              >
                Lost your password?
              </Link>
            </div>
          </form>

          {/* ================= REGISTER ================= */}
          <form className="account-card" onSubmit={handleRegister}>

            <h3 className="account-section-title">REGISTER</h3>

            <div className="form-group">
              <label>EMAIL ADDRESS <span className="required_fields"> * </span></label>
              <input
                type="email"
                className={registerEmailError ? "field-error-input" : ""}
                value={register.email}
                onChange={(event) => {
                  setRegister((prev) => ({ ...prev, email: event.target.value }))
                  if (registerEmailError) setRegisterEmailError("")
                }}
                aria-invalid={Boolean(registerEmailError)}
                required
              />
              {registerEmailError ? (
                <p className="form-field-error" role="alert">{registerEmailError}</p>
              ) : null}
              {!registerEmailError && isCheckingRegisterEmail ? (
                <p className="helper-text">Checking email...</p>
              ) : null}
            </div>

            <p className="helper-text">
              A link to set a new password will be sent to your email address.
            </p>

            <div className="form-group">
              <label>USER TYPE <span className="required_fields"> * </span></label>
              <select
                value={register.user_type}
                onChange={(event) =>
                  setRegister((prev) => ({ ...prev, user_type: event.target.value }))
                }
              >
                <option>Laboratory(manually reviewed)</option>
              </select>
            </div>

            <div className="form-group">
              <label>FIRST NAME <span className="required_fields"> * </span></label>
              <input
                type="text"
                value={register.first_name}
                onChange={(event) =>
                  setRegister((prev) => ({ ...prev, first_name: event.target.value }))
                }
                required
              />
            </div>

            <div className="form-group">
              <label>LAST NAME <span className="required_fields"> * </span></label>
              <input
                type="text"
                value={register.last_name}
                onChange={(event) =>
                  setRegister((prev) => ({ ...prev, last_name: event.target.value }))
                }
                required
              />
            </div>

            <div className="form-group">
              <label>COMPANY NAME <span className="required_fields"> * </span></label>
              <input
                type="text"
                value={register.Company_name}
                onChange={(event) =>
                  setRegister((prev) => ({ ...prev, Company_name: event.target.value }))
                }
                required
              />
            </div>

            <div className="form-group">
              <label>STREET ADDRESS <span className="required_fields"> * </span></label>
              <input
                type="text"
                value={register.Street_Address}
                onChange={(event) =>
                  setRegister((prev) => ({ ...prev, Street_Address: event.target.value }))
                }
                required
              />
            </div>

            <div className="form-group">
              <label>ADDRESS LINE 2</label>
              <input
                type="text"
                value={register.Address_Line_2}
                onChange={(event) =>
                  setRegister((prev) => ({ ...prev, Address_Line_2: event.target.value }))
                }
              />
            </div>

            <div className="form-group">
              <label>STATE <span className="required_fields"> * </span></label>
              <select
                value={register.state || 0}
                onChange={(event) =>
                  setRegister((prev) => ({ ...prev, state: parseInt(event.target.value) }))
                }
                required
              >
                <option value="">Select</option>
                {state.map((eachState) => (
                  <option key={eachState.id} value={eachState.id}>
                    {eachState.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>TOWN / CITY <span className="required_fields"> * </span></label>
              <input
                type="text"
                value={register.Town_City}
                onChange={(event) =>
                  setRegister((prev) => ({ ...prev, Town_City: event.target.value }))
                }
                required
              />
            </div>

            <div className="form-group">
              <label>POSTCODE / ZIP <span className="required_fields"> * </span></label>
              <input
                type="number"
                value={register.Zip_Code}
                onChange={(event) =>{
                  const value = event.target.value
                  const onlyDigits = value.replace(/\D/g, '')
                  setRegister((prev) =>({...prev, Zip_Code: onlyDigits }))
                }
              }  
                required
              />
            </div>

            <div className="form-group">
              <label>PHONE NUMBER <span className="required_fields"> * </span></label>
              <input
                type="tel"
                value={register.phone_number}
                max-length="10"
                onChange={(event) =>{
                    const value = event.target.value
                    const onlyDigits = value.replace(/\D/g, '')
                    if (onlyDigits.length <= 10) {
                        setRegister((prev) => ({ 
                            ...prev, 
                            phone_number: onlyDigits 
                        }))
                    }
                }}
                required
              />
            </div>

            <p className="privacy-text">
              Your personal data will be used to support your experience throughout this website,
              to manage access to your account, and for other purposes described in our{" "}
              <Link href="/privacy-policy" className="inline-block">
                <span>privacy policy</span>
              </Link>.
            </p>



            <button className="primary-btn lost-btn" type="submit" disabled={registerLoading}>
              {registerLoading ? "REGISTERING..." : "REGISTER"}
            </button>
          </form>

        </div>
      </div>
    </section>
  );
}
