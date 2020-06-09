import React from 'react'
import styled from 'styled-components'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import { RootState } from '../rootReducer'
import { selectAuditEntry } from '../ducks/actions'
import { AuditEntryTable } from '../components/table'
import { FilterCard } from '../components/filterCard'
import { InfoCard }from '../components/infoCard'
import { SearchCard } from '../components/searchCard'

const FilterSearchContainer = styled.div`
  display: flex;
  width: 20em;
  flex-direction: column;
`

const FlexRow =  styled.div`
  display: flex;
  height: 400px;
  align-items: center;
`

interface Props {
  data: any;
  handleRowClick: any;
}

const Explore: React.SFC<Props> = (props) => {
  const { handleRowClick } = props

  return (
    <>
      <FlexRow>
        <FilterSearchContainer>
          <FilterCard />
          <SearchCard />
        </FilterSearchContainer>
        <InfoCard />
      </FlexRow>
      <AuditEntryTable onRowClick={handleRowClick} height='300px' data={props.data}/>
    </>
  )
}

const mapStateToProps = (state: RootState) => {
  return {
    data: state.auditData
  }
}

const mapDispatchToProps = (dispatch: Dispatch) => {
  return {
    handleRowClick: (auditEntry: any) => dispatch(selectAuditEntry(auditEntry))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Explore)