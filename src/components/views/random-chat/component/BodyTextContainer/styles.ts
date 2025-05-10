import { COLOR } from "@/constant";
import { notoSansFontSetting, pretendardFontSetting } from "@/font";
import { styled } from "@mui/material";

export const Container = styled("div")({
    position: 'relative',
    zIndex: 10,
    width: '54%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '28px',
    '@media (max-width: 1280px)': {
        width: '60%'
    },
    '@media (max-width: 1200px)': {
        width: '100%',
        gap: '20px',
        paddingBottom: '12px',
    }
});

export const ComingSoonTextContainer = styled("div")({
    color: 'rgba(17, 17, 17, 0.60)',
    fontFamily: `${notoSansFontSetting.style.fontFamily} !important`,
    fontSize: '22px',
    fontStyle: 'italic',
    fontWeight: 400,
    lineHeight: '28px', /* 127.273% */
    '@media (max-width: 1200px)': {
        fontSize: '16px',
        textAlign: 'center',
    },
    '@media (max-width: 600px)': {
        fontSize: '14px',
        lineHeight: '20px', /* 142.857% */
    }
});

export const NewAdlerTextContainer = styled("div")({
    color: '#111',
    fontFamily: `${pretendardFontSetting.style.fontFamily}`,
    fontSize: '52px',
    fontStyle: 'normal',
    fontWeight: 500,
    lineHeight: '60px', /* 115.385% */
    textTransform: 'capitalize',
    whiteSpace: 'pre-wrap',
    'span': {
        color: COLOR.brandPrimary,
        fontWeight: 700,
    },
    '@media (max-width: 1200px)': {
        textAlign: 'center',
        fontSize: '36px',
        fontStyle: 'normal',
        fontWeight: 500,
        lineHeight: '44px', /* 122.222% */
        textTransform: 'capitalize'
    },
    '@media (max-width: 600px)': {
        fontSize: '28px',
        lineHeight: '36px', /* 128.571% */
    }
});

export const DetailTextContainer = styled("div")({
    color: 'rgba(17, 17, 17, 0.60)',
    fontFamily: `${pretendardFontSetting.style.fontFamily} !important`,
    fontSize: '20px',
    fontStyle: 'normal',
    fontWeight: 400,
    lineHeight: '28.8px', /* 144% */
    '@media (max-width: 1200px)': {
        textAlign: 'center',
        fontSize: '16px',
        lineHeight: '24px'
    },
    '@media (max-width: 600px)': {
        fontSize: '14px',
        lineHeight: '20px', /* 142.857% */
    }
});

export const EmailSection = styled("div")({
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    '@media (max-width: 1200px)': {
        width: '100%',
        gap: '4px',
    }
});

export const EmailSectionContainer = styled("div")({
    width: '591px',
    height: '72px',
    display: 'flex',
    borderRadius: '40px',
    opacity: 0.72,
    background: COLOR.white,
    boxShadow: '0px 1px 4px 0px rgba(0, 0, 0, 0.20) inset',
    '@media (max-width: 1200px)': {
        width: '100%',
        height: '44px',
        maxWidth: '591px',
        opacity: 1,
    }
});

export const EmailSectionInput = styled("input")({
    width: '351px',
    height: '72px',
    paddingInline: '24px',
    fontFamily: `${pretendardFontSetting.style.fontFamily} !important`,
    fontSize: '20px',
    fontStyle: 'normal',
    fontWeight: 400,
    lineHeight: '13px',
    display: 'flex',
    alignItems: 'center',
    background: 'transparent',
    outline: 'none',
    border: 'none',
    color: 'rgba(17, 17, 17, 0.90)',
    '&::placeholder': {
        color: 'rgba(17, 17, 17, 0.30)',
    },
    '@media (max-width: 1200px)': {
        width: '58%',
        fontSize: '16px',
        height: '44px',
    },
    '@media (max-width: 600px)': {
        fontSize: '14px',
        lineHeight: '20px', /* 142.857% */
    }
});

export const EmailSectionButton = styled("button")({
    width: '240px',
    height: '72px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '40px',
    background: 'rgba(17, 17, 17, 0.90) !important',
    color: COLOR.white,
    fontFamily: `${pretendardFontSetting.style.fontFamily} !important`,
    fontSize: '20px',
    fontStyle: 'normal',
    fontWeight: 400,
    lineHeight: '28.976px', /* 144.878% */
    outline: 'none',
    border: 'none',
    cursor: 'pointer',
    '&:hover': {
        background: `${COLOR.newAdlerDarkBackground} !important`,
        transition: 'background 0.3s ease-in-out',
    },
    '&:disabled': {
        background: 'rgba(17, 17, 17, 0.30) !important',
        cursor: 'not-allowed',
        '&:hover': {
            background: 'rgba(17, 17, 17, 0.30) !important',
            transition: 'none',
        },
    },
    '@media (max-width: 1200px)': {
        width: '42%',
        fontSize: '16px',
        height: '44px',
    },
    '@media (max-width: 600px)': {
        fontSize: '14px',
        lineHeight: '20px', /* 142.857% */
    }
});

export const ErrorMessage = styled("div")({
    paddingInline: '24px',
    color: 'red',
    fontFamily: `${pretendardFontSetting.style.fontFamily} !important`,
    fontSize: '14px',
    fontStyle: 'normal',
    fontWeight: 400,
    lineHeight: '20px', /* 142.857% */
    '@media (max-width: 1200px)': {
        fontSize: '10px',
    },
});