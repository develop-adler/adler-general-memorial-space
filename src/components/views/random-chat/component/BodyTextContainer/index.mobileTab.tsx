"use client";

import React from 'react';
import { Slide, SlideProps, Snackbar } from '@mui/material';

import * as S from './styles';

function SlideTransition(props: SlideProps) {
    return <Slide {...props} direction="down" />;
}

const BodyTextContainerMobile: React.FC = () => {

    const [email, setEmail] = React.useState<string>("");
    const [open, setOpen] = React.useState(false);
    const [emailError, setEmailError] = React.useState<string>("");
    const [submitting, setSubmitting] = React.useState(false);
    
    const emailInputRef = React.useRef<HTMLInputElement>(null);
    
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
    
        if (submitting) return;
        
        if (emailInputRef.current) {
            emailInputRef.current.blur();
        }
    
        setSubmitting(true);
        setEmailError("");
    
        if (!emailRegex.test(email)) {
            setEmailError("Please enter a valid email address.");
            setSubmitting(false);
            return;
        }
    
        if (!email) {
            setEmailError("Please enter your email address.");
            setSubmitting(false);
            return;
        }
    
        const date = new Date();
        const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const formattedTime = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
        const formattedDateTime = `${formattedDate} ${formattedTime}`;
    
        try {
          const response = await fetch("/apis/submit", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, date: formattedDateTime, source: 'Web App' }),
          });
              
          const result = await response.json();
          if (result.error) {
              setEmailError(result.error);
              return;
          }
          setOpen(true);
          setEmail("");
    
        } catch (err) {
          console.error(err);
        } finally {
            setSubmitting(false);
        }
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
        if (emailError) {
            setEmailError("");
        }
    }

    return (
        <S.Container>
            <Snackbar
                open={open}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                onClose={() => setOpen(false)}
                slots={{ transition: SlideTransition }}
                message="Thank you for your interest! We will notify you when we launch."
                key={'top center'}
                autoHideDuration={3000}
            />
            <S.NewAdlerTextContainer>
                This summer <br /> 
                a <span>new adler</span> is coming
            </S.NewAdlerTextContainer>
            <S.DetailTextContainer>
                Every person deserves a world to be fully themselves. <br />
                We’re taking a short pause to focus on building a place <br />
                to be fully yourself without limit.
            </S.DetailTextContainer>
            <S.EmailSection>
                <S.EmailSectionContainer>
                    <S.EmailSectionInput
                        ref={emailInputRef}
                        type="email"
                        placeholder="Enter your email here"
                        onChange={handleChange}
                        value={email}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}

                    />
                    <S.EmailSectionButton
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting}
                        >
                        Get Early Access
                    </S.EmailSectionButton>
                </S.EmailSectionContainer>
                {emailError && <S.ErrorMessage>{emailError}</S.ErrorMessage>}
            </S.EmailSection>
            <S.ComingSoonTextContainer>
                Coming Soon. Be part of what’s next.
            </S.ComingSoonTextContainer>
        </S.Container>
    )
}

export default BodyTextContainerMobile;