import { styled } from "@mui/material"

export const Container = styled("div")({
    width: '100dvw',
    height: '100dvh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'radial-gradient(69.82% 69.8% at 52.43% 13.97%, #ECF1F6 0%, #F4F4F5 97.3%)',
    overflow: 'hidden',
});

export const InnerContainer = styled("div")({
    position: 'relative',
    width: 'fit-content',
    height: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    gap: 'clamp(0px, 6.06dvh, 64px)',
    paddingTop: 'clamp(0px, 5.68dvh, 60px)',
    '@media (max-width: 1200px)': {
        width: '100%',
        maxWidth: '390px',
        paddingTop: '24px',
        gap: '60px'
    },
    '@media (max-width: 600px)': {
        paddingTop: '16px',
        gap: '40px'
    }
});


export const HeaderIcon = styled("div")({
    position: 'relative',
    zIndex: 10,
    width: 'fit-content',
    height: 'fit-content',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',  
});

export const VTuberImageContainer = styled("div")({
    position: 'relative',
    zIndex: 10,
    width: '46%',
    height: '100%',
    '@media (max-width: 1280px)': {
         width: '40%'
    },
    '@media (max-width: 1200px)': {
        width: '100%',
    }
});

export const VTuberImage = styled("div")({
    position: 'absolute',
    bottom: '0px',
    left: '12.17%',
    width: '100%',
    height: '100%',
    maxWidth: '482px',
    maxHeight: '671px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    '@media (max-width: 1280px)': {
        left: '0px',
    },
    '@media (max-width: 1200px)': {
        alignItems: 'flex-end',
        bottom: '38px',
    },
});

export const FirstFiletrContainer = styled("div")({
    position: 'absolute',
    zIndex: 1,
    right: '-237px',
    top: '-143px',
    width: '604px',
    height: '525px',
    flexShrink: 0,
    borderRadius: '604px',
    background: 'rgba(230, 65, 123, 0.12)',
    filter: 'blur(85.6097640991211px)',
});
export const SecondFiletrContainer = styled("div")({
    position: 'absolute',
    zIndex: 1,
    bottom: '-37px',
    left: '-142px',
    width: '668px',
    height: '460px',
    flexShrink: 0,
    borderRadius: '668px',
    background: 'rgba(230, 65, 123, 0.12)',
    filter: 'blur(85.6097640991211px)'
});