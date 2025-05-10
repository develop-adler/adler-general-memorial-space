import { pretendardFontSetting } from "@/font";
import { styled } from "@mui/material";

export const Container = styled("div")({
    position: 'absolute',
    zIndex: 10,
    bottom: '0px',
    left: '0px',
    width: '87.64dvw',
    maxWidth: '1518px',
    height: '86px',
    borderRadius: '32px 32px 0px 0px',
    border: '1px solid #FFF',
    background: 'rgba(245, 246, 255, 0.70)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingInline: '32px',
    '@media (max-width: 1200px)': {
        width: '100%',
        maxWidth: '100%',
        height: '51px',
        border: '1px solid #FFF',
        background: '#F5F6FF',
        paddingInline: '16px',
    }
});

export const FooterTextContainer = styled("div")({
    color: '#837985',
    fontFamily: `${pretendardFontSetting.style.fontFamily} !important`,
    fontSize: '20px',
    fontStyle: 'normal',
    fontWeight: 400,
    lineHeight: '28.8px', /* 144% */
    '@media (max-width: 1200px)': {
        fontSize: '10px',
    }
});

export const FooterSocialContainer = styled("div")({
    width: 'fit-content',
    height: 'fit-content',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '24px',
    '@media (max-width: 1200px)': {
        gap: '12px',
    }
    
});

export const FooterSocialIconContainer = styled("a")({
    width: 'fit-content',
    height: 'fit-content',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
});