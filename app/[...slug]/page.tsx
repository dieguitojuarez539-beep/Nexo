import Marketplace from '@/components/marketplace';
export default async function Page({params}:{params:Promise<{slug:string[]}>}){const {slug}=await params;return <Marketplace path={'/'+slug.join('/')}/>}
