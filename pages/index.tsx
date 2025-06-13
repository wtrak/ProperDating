export async function getServerSideProps() {
  return {
    redirect: {
      destination: '/auth',
      permanent: false,
    },
  }
}

export default function Home() {
  return null
}
