import React from 'react';
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import axios from 'axios';

const Schema = z.object({
  firstName: z
    .string()
    .min(1, { message: "First name is required" }),
  lastName: z
    .string()
    .min(1, { message: "Last name is required" }),
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

const Signup = () => {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
  } = useForm({
    resolver: zodResolver(Schema),
  });

  const onSubmit = async (data) => {
    try {
      const response = await axios.post('http://localhost:4000/signup', data);
      console.log('Response:', response.data);
      alert("User added successfully.")
      navigate("/");
    } catch (error) {
      console.error('Validation error:', error);
      alert(error.response?.data?.error || "An error occurred");
    }
  };

  return (
    <section className='signInPage'>
      <div className="container">
        <div className="signin-box">
          <h1>Sign up</h1>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className='mb-3'>
              <input
                type="text"
                className='form-control'
                placeholder="First Name"
                {...register("firstName", {
                  onBlur: () => trigger("firstName"),
                  onChange: () => {
                    trigger("firstName");
                  },
                })}
              />
              {errors.firstName && (
                <div className="text-danger pt-2" style={{ color: 'red', fontSize: '11px' }}>{errors.firstName.message}</div>
              )}
            </div>
            <div className='mb-3'>
              <input
                type="text"
                className='form-control'
                placeholder="Last Name"
                {...register("lastName", {
                  onBlur: () => trigger("lastName"),
                  onChange: () => {
                    trigger("lastName");
                  },
                })}
              />
              {errors.lastName && (
                <div className="text-danger pt-2" style={{ color: 'red', fontSize: '11px' }}>{errors.lastName.message}</div>
              )}
            </div>
            <div className='mb-3'>
              <input
                type="text"
                className='form-control'
                placeholder="Email"
                {...register("email", {
                  onBlur: () => trigger("email"),
                  onChange: () => {
                    trigger("email");
                  },
                })}
              />
              {errors.email && (
                <div className="text-danger pt-2" style={{ color: 'red', fontSize: '11px' }}>{errors.email.message}</div>
              )}
            </div>
            <div className="password-field mb-3">
              <input
                type='text'
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
                <div className="text-danger pt-2" style={{ color: 'red', fontSize: '11px' }}>
                  {errors.password.message}
                </div>
              )}
            </div>

            <button className="btn btn-primary w-100">
              Sign up
            </button>
            <Link to='/' className="forgot-password w-100 text-center pt-3 d-block">
              Signin
            </Link>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Signup;
