/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to Play It Forward — confirm your email</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Text style={logo}>PIF</Text>
        </Section>
        <Heading style={h1}>LET'S GET YOU ON THE COURT</Heading>
        <Text style={text}>
          Welcome to{' '}
          <Link href={siteUrl} style={link}>
            <strong>Play It Forward</strong>
          </Link>
          ! You're one step away from elite training.
        </Text>
        <Text style={text}>
          Confirm your email (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ) to start your journey:
        </Text>
        <Button style={button} href={confirmationUrl}>
          CONFIRM EMAIL
        </Button>
        <Text style={footer}>
          If you didn't sign up for Play It Forward, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

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
const link = { color: '#D94432', textDecoration: 'underline' }
const button = {
  backgroundColor: '#D94432',
  color: '#ffffff',
  fontFamily: "'Barlow Condensed', Arial, sans-serif",
  fontWeight: '800' as const,
  fontSize: '15px',
  borderRadius: '14px',
  padding: '14px 28px',
  textDecoration: 'none',
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
}
const footer = { fontSize: '12px', color: '#999999', margin: '32px 0 0' }
