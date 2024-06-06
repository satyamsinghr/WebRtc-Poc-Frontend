import React from 'react';
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import axios from 'axios';

const LoginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email("Invalid Email address"),
  password: z
    .string()
    .min(1, { message: "Password is required" })
    .refine(
      (value) =>
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
          value
        ),
      {
        message:
          "Please enter valid Password",
      }
    ),
});

const Signin = () => {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
  } = useForm({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = async (data) => {
    try {
      const response = await axios.post('http://localhost:4000/signin', data);
      localStorage.setItem('userdata', JSON.stringify(response.data.user));
      navigate("/chat");
      alert("Login successfully.")
    } catch (error) {
        alert(error.response.data.error)
      console.error('Validation error:', error);
    }
  };

  return (
    <section className='signInPage'>
      <div className="container">
        <div className="signin-box">
          <h1>Sign in</h1>
          <form onSubmit={handleSubmit(onSubmit)}>
          <div className="password-field mb-3">
            <input
              type="email"
              className='form-control'
              placeholder="Email"
              id="email"
              {...register("email", {
                onBlur: () => trigger("email"),
                onChange: () => {
                  trigger("email");
                },
              })}
            />
            {errors.email && (
              <div className="text-danger pt-2" style={{color:'red', fontSize:'11px'}}>{errors.email.message}</div>
            )}
             </div>
            <div className="password-field mb-3">
              <input
                type='password'
                className='form-control'
                placeholder="Password"
                {...register("password", {
                  onBlur: () => trigger("password"),
                  onChange: () => {
                    trigger("password");
                  }
                })}
              />
              {errors.password && (
                <div className="text-danger pt-2" style={{color:'red', fontSize:'11px'}}>
                  {errors.password.message}
                </div>
              )}
            </div>
            <button className="btn btn-primary w-100">
          Login
            </button>
            <Link to='/signup' className="forgot-password w-100 text-center pt-3 d-block">
              SignUp
            </Link>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Signin;
