"use client"

import * as S from './styles';

type Props = {
    children?: React.ReactNode;
}

const BodyContainer: React.FC<Props> = ({ children }) => {
  return (
    <S.Body>
        <S.BodyFilterFirst />
        <S.BodyFilterSecond />
        <S.BodyFilterThird />
        {children}
    </S.Body>
  )
}

export default BodyContainer