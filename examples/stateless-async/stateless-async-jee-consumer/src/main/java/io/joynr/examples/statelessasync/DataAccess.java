/*-
 * #%L
 * %%
 * Copyright (C) 2018 BMW Car IT GmbH
 * %%
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * #L%
 */
package io.joynr.examples.statelessasync;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import joynr.examples.statelessasync.VehicleConfiguration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.NoResultException;
import javax.persistence.NonUniqueResultException;
import javax.persistence.PersistenceContext;
import javax.persistence.Query;
import javax.transaction.Transactional;
import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Stateless
@Transactional
public class DataAccess {

    private static final Logger LOG = LoggerFactory.getLogger(DataAccess.class);

    private static final ObjectMapper objectMapper = new ObjectMapper().setSerializationInclusion(JsonInclude.Include.NON_NULL)
                                                                       .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES,
                                                                                  false);

    @PersistenceContext(unitName = "statelessAsync")
    private EntityManager entityManager;

    public void addKnownConfiguration(String messageId, String configurationId) {
        KnownVehicleConfiguration newConfig = new KnownVehicleConfiguration();
        newConfig.setTechnicalId(UUID.randomUUID().toString());
        newConfig.setMessageId(messageId);
        newConfig.setVehicleConfigurationId(configurationId);
        entityManager.persist(newConfig);
        LOG.info("Persisted known config: {}", newConfig);
    }

    public void updateKnownConfiguration(String messageId, boolean success) {
        Query query = entityManager.createQuery("select kc from KnownVehicleConfiguration kc where kc.messageId = :messageId");
        query.setParameter("messageId", messageId);
        KnownVehicleConfiguration knownConfiguration = (KnownVehicleConfiguration) query.getSingleResult();
        knownConfiguration.setSuccessfullyAdded(success);
    }

    public Set<KnownVehicleConfiguration> getAllKnownVehicleConfigurations() {
        List<KnownVehicleConfiguration> resultList = entityManager.createQuery("select kvc from KnownVehicleConfiguration kvc")
                                                                  .getResultList();
        return resultList.stream().collect(Collectors.toSet());
    }

    public void addGetResult(String messageId) {
        GetResult getResult = new GetResult();
        getResult.setTechnicalId(UUID.randomUUID().toString());
        getResult.setMessageId(messageId);
        entityManager.persist(getResult);
    }

    public void updateGetResult(String messageId, VehicleConfiguration vehicleConfiguration) {
        GetResult getResult = findGetResultForMessageId(messageId).orElseThrow(() -> new NoResultException("No get result for message ID: "
                + messageId + " found."));
        getResult.setFulfilled(true);
        try {
            getResult.setPayload(objectMapper.writeValueAsString(vehicleConfiguration));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Unable to serialise " + vehicleConfiguration + " as JSON.", e);
        }
    }

    public Set<GetResult> getAllGetResults() {
        List<GetResult> resultList = entityManager.createQuery("select gr from GetResult gr").getResultList();
        return resultList.stream().collect(Collectors.toSet());
    }

    public Optional<GetResult> findGetResultForMessageId(String messageId) {
        Query query = entityManager.createQuery("select gr from GetResult gr where gr.messageId = :messageId");
        query.setParameter("messageId", messageId);
        List<GetResult> resultList = query.getResultList();
        LOG.trace("Get result for {}:\n{}", messageId, resultList);
        if (resultList.isEmpty()) {
            return Optional.empty();
        }
        if (resultList.size() > 1) {
            throw new NonUniqueResultException("Several entities found with messageId: " + messageId);
        }
        return Optional.of(resultList.get(0));
    }

    public Optional<VehicleConfiguration> getVehicleConfigurationForMessageId(String messageId) {
        return findGetResultForMessageId(messageId).filter(GetResult::isFulfilled).map(getResult -> {
            try {
                return objectMapper.readValue(getResult.getPayload(), VehicleConfiguration.class);
            } catch (IOException e) {
                LOG.warn("Invalid payload:\n{}\nreturning null.", e);
                return null;
            }
        });
    }
}
