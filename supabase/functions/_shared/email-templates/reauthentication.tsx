/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Play It Forward verification code</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Text style={logo}>PIF</Text>
        </Section>
        <Heading style={h1}>VERIFY YOUR IDENTITY</Heading>
        <Text style={text}>Use this code to confirm your identity:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          This code expires shortly. If you didn't request this, ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Barlow', Arial, sans-serif" }
const container = { padding: '40px 25px', maxWidth: '480px', margin: '0 auto' }
const logoSection = {
  backgroundColor: '#D94432',
  borderRadius: '14px',
  padding: '12px 20px',
  display: 'inline-block' as const,
  marginBottom: '24px',
}
const logo = {
  fontFamily: "'Barlow Condensed', Arial, sans-serif",
  fontWeight: 'bold' as const,
  fontSize: '20px',
  color: '#ffffff',
  margin: '0',
  letterSpacing: '0.05em',
}
const h1 = {
  fontFamily: "'Barlow Condensed', Arial, sans-serif",
  fontSize: '24px',
  fontWeight: '900' as const,
  color: '#0f172a',
  margin: '0 0 20px',
  letterSpacing: '0.04em',
  textTransform: 'uppercase' as const,
}
const text = {
  fontSize: '15px',
  color: '#555555',
  lineHeight: '1.6',
  margin: '0 0 20px',
}
const codeStyle = {
  fontFamily: 'Courier, monospace',
  fontSize: '28px',
  fontWeight: 'bold' as const,
  color: '#D94432',
  margin: '0 0 30px',
  letterSpacing: '0.15em',
}
const footer = { fontSize: '12px', color: '#999999', margin: '32px 0 0' }
