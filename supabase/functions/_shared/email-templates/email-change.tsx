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

interface EmailChangeEmailProps {
  siteName: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  email,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your new email for Play It Forward</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Text style={logo}>PIF</Text>
        </Section>
        <Heading style={h1}>CONFIRM YOUR NEW EMAIL</Heading>
        <Text style={text}>
          You requested to change your Play It Forward email from{' '}
          <Link href={`mailto:${email}`} style={link}>{email}</Link>{' '}
          to{' '}
          <Link href={`mailto:${newEmail}`} style={link}>{newEmail}</Link>.
        </Text>
        <Text style={text}>Confirm the change below:</Text>
        <Button style={button} href={confirmationUrl}>
          CONFIRM EMAIL CHANGE
        </Button>
        <Text style={footer}>
          Didn't request this? Secure your account immediately.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

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
