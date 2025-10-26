"use client";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import {  EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import React, { useState } from "react";
import { useRouter } from 'next/navigation';
import { login } from '@/services/authService';
import { useForm } from "react-hook-form";
import Alert from "../ui/alert/Alert";
// import { toast } from "react-hot-toast";

  type FormData = {
  username: string ;
  password: string ;
};

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");

  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>();


  const onSubmit = async (data: FormData) => {
    console.log("Form submitted with data:", data);
    
    setServerError("");
    try {
      const user = await login(data.username, data.password);
      if (user.role === "admin") {
        router.push("/admin/dashboard");
      } else if (user.role === "guard") {
        console.log("Redirecting to guard dashboard");
        
        router.push("/guard/dashboard");
      } else {
        router.push("/signin");
      }
    } catch (err: any) {
      setServerError(err.message || "אירעה שגיאה בהתחברות");
    }
  };


  return (
    <div className="flex py-20 lg:w-1/2 w-full">

      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-7 sm:mb-8 md:mb-5 text-center">
            <h1 className=" mb-2 font-semibold text-gray-800 text-title-md dark:text-white/90 sm:text-title-md">
              התחברות
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              התחבר עם השם משתמש והסיסמה שלך !
            </p>
          </div>
          <div>

            <div className="relative py-3 sm:py-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
              </div>

            </div>
<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label>
                שם משתמש <span className="text-error-500">*</span>
              </Label>
              <Input
                placeholder="הזן שם משתמש"
                {...register("username", { required: "שדה חובה" })}
              />
              {errors.username && (
                <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>
              )}
            </div>

            <div>
              <Label>
                סיסמא <span className="text-error-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="הזן סיסמא"
                  {...register("password", { required: "שדה חובה" })}
                />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute z-30 -translate-y-1/2 cursor-pointer left-4 top-1/2"
                >
                  {showPassword ? (
                    <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                  ) : (
                    <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                  )}
                </span>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Link
                href="/reset-password"
                className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                שכחת סיסמא?
              </Link>
            </div>

            {serverError && (
              <Alert
                variant="error"
                title="שגיאה בהתחברות"
                message={serverError}
                showLink={false}
                />)}
            <Button className="w-full" size="sm" type="submit" disabled={isSubmitting}>
              
              {isSubmitting ? "טוען..." : "התחבר"}
            </Button>
          </form>


          </div>
        </div>
      </div>
    </div>
  );
}
